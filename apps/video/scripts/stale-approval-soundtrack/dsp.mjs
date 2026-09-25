import { writeFileSync } from 'node:fs';

// Signal-processing building blocks for the soundtrack: oscillators, filters, effects and WAV output.
// Everything works on plain Float64Array stereo tracks at a fixed sample rate.

export const SAMPLE_RATE = 44100;
export const TWO_PI = 2 * Math.PI;

export const createTrack = (sampleCount) => ({
  left: new Float64Array(sampleCount),
  right: new Float64Array(sampleCount),
});

export const midiToFrequency = (note) => 440 * 2 ** ((note - 69) / 12);

// Seeded pseudo-random numbers (mulberry32), so every regeneration produces the same noise and phases.
export const createRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const smoothstep = (value) => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};

// Constant-power pan: -1 is hard left, 1 is hard right.
export const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

// Converts a start time and duration to a sample range that stays inside the track.
export const sampleRange = (track, startSeconds, durationSeconds) => {
  const startSample = Math.max(0, Math.round(startSeconds * SAMPLE_RATE));
  const endSample = Math.min(track.left.length, Math.round((startSeconds + durationSeconds) * SAMPLE_RATE));
  return { startSample, sampleCount: Math.max(0, endSample - startSample) };
};

// Sawtooth with PolyBLEP correction at the wrap, which removes most of the aliasing of a naive saw.
export class SawOscillator {
  constructor(frequency, phase = 0) {
    this.phase = phase;
    this.setFrequency(frequency);
  }

  setFrequency(frequency) {
    this.increment = frequency / SAMPLE_RATE;
  }

  next() {
    const increment = this.increment;
    let phase = this.phase + increment;
    if (phase >= 1) phase -= 1;
    this.phase = phase;

    let value = 2 * phase - 1;
    if (phase < increment) {
      const t = phase / increment;
      value -= t + t - t * t - 1;
    } else if (phase > 1 - increment) {
      const t = (phase - 1) / increment;
      value -= t * t + t + t + 1;
    }
    return value;
  }
}

// Topology-preserving state-variable filter (Simper), which stays stable while its cutoff moves.
// After process(), the lowpass, bandpass and highpass outputs are available as fields.
export class StateVariableFilter {
  constructor(cutoff = 1000, resonance = Math.SQRT1_2) {
    this.firstState = 0;
    this.secondState = 0;
    this.lowpass = 0;
    this.bandpass = 0;
    this.highpass = 0;
    this.setCutoff(cutoff, resonance);
  }

  setCutoff(cutoff, resonance = this.resonance) {
    this.resonance = resonance;
    const clampedCutoff = Math.min(Math.max(cutoff, 20), SAMPLE_RATE * 0.45);
    const g = Math.tan((Math.PI * clampedCutoff) / SAMPLE_RATE);
    this.damping = 1 / resonance;
    this.coefficient1 = 1 / (1 + g * (g + this.damping));
    this.coefficient2 = g * this.coefficient1;
    this.coefficient3 = g * this.coefficient2;
  }

  process(input) {
    const v3 = input - this.secondState;
    const v1 = this.coefficient1 * this.firstState + this.coefficient2 * v3;
    const v2 = this.secondState + this.coefficient2 * this.firstState + this.coefficient3 * v3;
    this.firstState = 2 * v1 - this.firstState;
    this.secondState = 2 * v2 - this.secondState;
    this.lowpass = v2;
    this.bandpass = v1;
    this.highpass = input - this.damping * v1 - v2;
  }
}

export const highpassTrack = (track, cutoff) => {
  [track.left, track.right].forEach((channel) => {
    const filter = new StateVariableFilter(cutoff);
    for (let i = 0; i < channel.length; i++) {
      filter.process(channel[i]);
      channel[i] = filter.highpass;
    }
  });
};

export const scaleTrack = (track, gainAt) => {
  for (let i = 0; i < track.left.length; i++) {
    const gain = gainAt(i);
    track.left[i] *= gain;
    track.right[i] *= gain;
  }
};

export const addTrack = (target, source, gain = 1) => {
  for (let i = 0; i < target.left.length; i++) {
    target.left[i] += source.left[i] * gain;
    target.right[i] += source.right[i] * gain;
  }
};

// Freeverb (Jezar): eight damped comb filters into four allpass filters per channel, with the right
// channel's delay lines slightly longer for stereo width. Returns only the wet signal.
const COMB_TUNINGS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_TUNINGS = [556, 441, 341, 225];
const STEREO_SPREAD = 23;

export const renderReverb = (input, { roomSize, damping, preDelaySeconds = 0.02 }) => {
  const feedback = roomSize * 0.28 + 0.7;
  const dampingAmount = damping * 0.4;
  const preDelaySamples = Math.round(preDelaySeconds * SAMPLE_RATE);

  const reverbChannel = (channel, spread) => {
    const output = new Float64Array(channel.length);
    const combs = COMB_TUNINGS.map((tuning) => ({
      buffer: new Float64Array(tuning + spread),
      index: 0,
      filterStore: 0,
    }));
    const allpasses = ALLPASS_TUNINGS.map((tuning) => ({ buffer: new Float64Array(tuning + spread), index: 0 }));
    for (let i = 0; i < channel.length; i++) {
      const dry = i >= preDelaySamples ? channel[i - preDelaySamples] * 0.015 : 0;
      let sum = 0;
      for (const comb of combs) {
        const delayed = comb.buffer[comb.index];
        comb.filterStore = delayed * (1 - dampingAmount) + comb.filterStore * dampingAmount;
        comb.buffer[comb.index] = dry + comb.filterStore * feedback;
        comb.index = (comb.index + 1) % comb.buffer.length;
        sum += delayed;
      }
      for (const allpass of allpasses) {
        const delayed = allpass.buffer[allpass.index];
        allpass.buffer[allpass.index] = sum + delayed * 0.5;
        allpass.index = (allpass.index + 1) % allpass.buffer.length;
        sum = delayed - sum;
      }
      output[i] = sum * 3;
    }
    return output;
  };

  return { left: reverbChannel(input.left, 0), right: reverbChannel(input.right, STEREO_SPREAD) };
};

// Ping-pong delay: the first repeat lands on the left, the next on the right, and so on. Each repeat
// passes a one-pole lowpass, so the echoes get darker as they fade. Returns only the wet signal.
export const renderPingPongDelay = (input, { delaySeconds, feedback, damping }) => {
  const delaySamples = Math.round(delaySeconds * SAMPLE_RATE);
  const sampleCount = input.left.length;
  const left = new Float64Array(sampleCount);
  const right = new Float64Array(sampleCount);
  let leftLowpass = 0;
  let rightLowpass = 0;
  for (let i = delaySamples; i < sampleCount; i++) {
    // The left line hears the dry input plus the right line's repeats; the right line hears the left's.
    const monoInput = (input.left[i - delaySamples] + input.right[i - delaySamples]) * 0.5;
    leftLowpass += (monoInput + feedback * right[i - delaySamples] - leftLowpass) * (1 - damping);
    left[i] = leftLowpass;
    rightLowpass += (feedback * left[i - delaySamples] - rightLowpass) * (1 - damping);
    right[i] = rightLowpass;
  }
  return { left, right };
};

// Sidechain shape: 1 right after every trigger, decaying exponentially back to 0. A track ducked by
// depth d is scaled by 1 - d * shape, so it breathes with the kick drum.
export const createDuckingShape = (sampleCount, triggerSeconds, { releaseSeconds }) => {
  const shape = new Float64Array(sampleCount);
  const attackSamples = Math.round(0.004 * SAMPLE_RATE);
  const lengthSamples = Math.round(releaseSeconds * 5 * SAMPLE_RATE);
  triggerSeconds.forEach((triggerTime) => {
    const startSample = Math.round(triggerTime * SAMPLE_RATE);
    for (let i = 0; i < lengthSamples && startSample + i < sampleCount; i++) {
      const amount = Math.min(1, i / attackSamples) * Math.exp(-i / SAMPLE_RATE / releaseSeconds);
      shape[startSample + i] = Math.max(shape[startSample + i], amount);
    }
  });
  return shape;
};

// 16-bit stereo PCM WAV.
export const writeWav = (path, { left, right }) => {
  const sampleCount = left.length;
  const wavData = Buffer.alloc(44 + sampleCount * 4);
  wavData.write('RIFF', 0);
  wavData.writeUInt32LE(36 + sampleCount * 4, 4);
  wavData.write('WAVE', 8);
  wavData.write('fmt ', 12);
  wavData.writeUInt32LE(16, 16);
  wavData.writeUInt16LE(1, 20);
  wavData.writeUInt16LE(2, 22);
  wavData.writeUInt32LE(SAMPLE_RATE, 24);
  wavData.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wavData.writeUInt16LE(4, 32);
  wavData.writeUInt16LE(16, 34);
  wavData.write('data', 36);
  wavData.writeUInt32LE(sampleCount * 4, 40);
  for (let i = 0; i < sampleCount; i++) {
    wavData.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    wavData.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 44 + i * 4 + 2);
  }
  writeFileSync(path, wavData);
};
