import {
  createRandom,
  midiToFrequency,
  panGains,
  SAMPLE_RATE,
  SawOscillator,
  StateVariableFilter,
  sampleRange,
  smoothstep,
  TWO_PI,
} from './dsp.mjs';

// The instruments of the soundtrack. Each one renders a single note or hit into a stereo track.

// One shared noise source, so every regeneration produces the same soundtrack.
const random = createRandom(2026);
const noise = () => random() * 2 - 1;

// How often filter cutoffs are recalculated while they move, in samples.
const CONTROL_INTERVAL = 32;

// Kick: a sine that sweeps from 170 Hz down to 46 Hz, a noise click that keeps it audible on small
// speakers, and soft saturation for weight.
export const playKick = (track, time, { gain = 1 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.5);
  let phase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    phase += (TWO_PI * (46 + 124 * Math.exp(-t * 30))) / SAMPLE_RATE;
    const body = Math.sin(phase) * Math.exp(-t * 7);
    const click = noise() * Math.exp(-t * 700) * 0.5;
    const sample = Math.tanh((body + click) * 1.8) * gain;
    track.left[startSample + i] += sample;
    track.right[startSample + i] += sample;
  }
};

// Clap: three short bursts of bandpassed noise a few milliseconds apart, then a short tail.
const CLAP_BURST_OFFSETS = [0, 0.012, 0.024];

export const playClap = (track, time, { gain = 1, pan = 0 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.4);
  const bandpass = new StateVariableFilter(1400, 1.1);
  const [leftGain, rightGain] = panGains(pan);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    let envelope = t >= 0.024 ? 0.6 * Math.exp(-(t - 0.024) * 16) : 0;
    for (const offset of CLAP_BURST_OFFSETS) {
      if (t >= offset) envelope = Math.max(envelope, Math.exp(-(t - offset) * 220));
    }
    bandpass.process(noise());
    const sample = bandpass.bandpass * envelope * gain * 2.5;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Shaker: a very short burst of highpassed noise.
export const playShaker = (track, time, { gain = 1, pan = 0 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.09);
  const highpass = new StateVariableFilter(7000);
  const [leftGain, rightGain] = panGains(pan);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    highpass.process(noise());
    const sample = highpass.highpass * Math.min(1, t / 0.004) * Math.exp(-t * 50) * gain;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Clock tick: a woody click from two inharmonic sine modes and a noise transient. The tock is the
// same sound at a lower pitch.
export const playTick = (track, time, { gain = 1, pitch = 1, pan = 0 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.1);
  const frequency = 1900 * pitch;
  const [leftGain, rightGain] = panGains(pan);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const body = Math.sin(TWO_PI * frequency * t) * Math.exp(-t * 95);
    const overtone = 0.45 * Math.sin(TWO_PI * frequency * 2.76 * t) * Math.exp(-t * 170);
    const transient = 0.35 * noise() * Math.exp(-t * 900);
    const sample = (body + overtone + transient) * gain;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Crash: decorrelated highpassed noise per channel with a long decay, plus a resonant band for shimmer.
export const playCrash = (track, time, { gain = 1, decaySeconds = 1.6 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, decaySeconds * 1.5);
  const leftHighpass = new StateVariableFilter(5000);
  const rightHighpass = new StateVariableFilter(5000);
  const leftShimmer = new StateVariableFilter(8200, 3);
  const rightShimmer = new StateVariableFilter(8200, 3);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, t / 0.002) * Math.exp((-3 * t) / decaySeconds) * gain;
    const leftNoise = noise();
    const rightNoise = noise();
    leftHighpass.process(leftNoise);
    rightHighpass.process(rightNoise);
    leftShimmer.process(leftNoise);
    rightShimmer.process(rightNoise);
    track.left[startSample + i] += (leftHighpass.highpass * 0.7 + leftShimmer.bandpass * 0.5) * envelope;
    track.right[startSample + i] += (rightHighpass.highpass * 0.7 + rightShimmer.bandpass * 0.5) * envelope;
  }
};

// Tom: a short pitched thud, used as the marker hit when Magic Eden's closing date lands.
export const playTom = (track, time, { gain = 1 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.5);
  let phase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    phase += (TWO_PI * (95 + 55 * Math.exp(-t * 18))) / SAMPLE_RATE;
    const sample = Math.tanh(Math.sin(phase) * Math.exp(-t * 9) * 1.5) * gain;
    track.left[startSample + i] += sample;
    track.right[startSample + i] += sample;
  }
};

// Interface click for the toggle switch: a very short FM blip.
export const playClick = (track, time, { gain = 1, pan = 0 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.06);
  const [leftGain, rightGain] = panGains(pan);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const sample = Math.sin(TWO_PI * 1500 * t + 1.5 * Math.sin(TWO_PI * 3000 * t)) * Math.exp(-t * 80) * gain;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Bass: a sine sub for weight, plus a lowpassed saw with a short filter pluck and soft saturation, so
// the bass line still reads on phone speakers that cannot reproduce the fundamental.
export const playBass = (track, time, durationSeconds, note, { gain = 1, cutoff = 700, pluck = 1.5 } = {}) => {
  const releaseSeconds = 0.05;
  const { startSample, sampleCount } = sampleRange(track, time, durationSeconds + releaseSeconds);
  const frequency = midiToFrequency(note);
  const saw = new SawOscillator(frequency);
  const lowpass = new StateVariableFilter(cutoff, 0.9);
  let subPhase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    if (i % CONTROL_INTERVAL === 0) lowpass.setCutoff(cutoff * (1 + pluck * Math.exp(-t * 14)));
    subPhase += (TWO_PI * frequency) / SAMPLE_RATE;
    lowpass.process(saw.next());
    const release = t > durationSeconds ? Math.max(0, 1 - (t - durationSeconds) / releaseSeconds) : 1;
    const envelope = Math.min(1, t / 0.004) * release;
    const sample = Math.tanh((Math.sin(subPhase) * 0.6 + lowpass.lowpass * 0.9) * 1.4) * envelope * gain;
    track.left[startSample + i] += sample;
    track.right[startSample + i] += sample;
  }
};

// Pad: five detuned band-limited saws per note spread across the stereo field, through a lowpass
// whose cutoff can sweep exponentially over the note, for builds.
const PAD_VOICE_DETUNES = [-0.008, -0.0035, 0, 0.0035, 0.008];
const PAD_VOICE_PANS = [-0.8, -0.4, 0, 0.4, 0.8];

export const playPad = (
  track,
  time,
  durationSeconds,
  notes,
  { gain = 1, attackSeconds = 0.5, releaseSeconds = 0.8, cutoff = 1800, cutoffEnd = cutoff, resonance = 0.8 } = {},
) => {
  const { startSample, sampleCount } = sampleRange(track, time, durationSeconds + releaseSeconds);
  const voices = notes.flatMap((note) =>
    PAD_VOICE_DETUNES.map((detune, voiceIndex) => ({
      oscillator: new SawOscillator(midiToFrequency(note) * (1 + detune), random()),
      pan: panGains(PAD_VOICE_PANS[voiceIndex]),
    })),
  );
  const leftFilter = new StateVariableFilter(cutoff, resonance);
  const rightFilter = new StateVariableFilter(cutoff, resonance);
  const voiceGain = gain / Math.sqrt(voices.length);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    if (i % CONTROL_INTERVAL === 0) {
      const sweepCutoff = cutoff * (cutoffEnd / cutoff) ** Math.min(1, t / durationSeconds);
      leftFilter.setCutoff(sweepCutoff);
      rightFilter.setCutoff(sweepCutoff);
    }
    let leftSum = 0;
    let rightSum = 0;
    for (const voice of voices) {
      const value = voice.oscillator.next();
      leftSum += value * voice.pan[0];
      rightSum += value * voice.pan[1];
    }
    leftFilter.process(leftSum);
    rightFilter.process(rightSum);
    const envelope = smoothstep(t / attackSeconds) * (1 - smoothstep((t - durationSeconds) / releaseSeconds));
    track.left[startSample + i] += leftFilter.lowpass * envelope * voiceGain;
    track.right[startSample + i] += rightFilter.lowpass * envelope * voiceGain;
  }
};

// Pluck: two slightly detuned saws through a lowpass that snaps shut, the classic synth pluck.
export const playPluck = (track, time, note, { gain = 1, brightness = 1, pan = 0, decay = 7 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 0.8);
  const frequency = midiToFrequency(note);
  const lowerSaw = new SawOscillator(frequency * 0.997, random());
  const upperSaw = new SawOscillator(frequency * 1.003, random());
  const lowpass = new StateVariableFilter(frequency, 1.4);
  const [leftGain, rightGain] = panGains(pan);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    if (i % CONTROL_INTERVAL === 0) lowpass.setCutoff(frequency * 1.5 + 5000 * brightness * Math.exp(-t * 16));
    lowpass.process((lowerSaw.next() + upperSaw.next()) * 0.5);
    const sample = lowpass.lowpass * Math.min(1, t / 0.002) * Math.exp(-t * decay) * gain;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Glass bell: two-operator FM with the modulator at 3.5 times the carrier. The modulation fades faster
// than the tone, so the strike is bright and the tail is pure. An optional glide bends the pitch down.
export const playBell = (
  track,
  time,
  note,
  { gain = 1, decay = 2.4, pan = 0, glideSemitones = 0, glideSeconds = 0.25 } = {},
) => {
  const { startSample, sampleCount } = sampleRange(track, time, Math.min(4, 7 / decay));
  const baseFrequency = midiToFrequency(note);
  const [leftGain, rightGain] = panGains(pan);
  let carrierPhase = 0;
  let modulatorPhase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const frequency = baseFrequency * 2 ** ((-glideSemitones * smoothstep(t / glideSeconds)) / 12);
    carrierPhase += (TWO_PI * frequency) / SAMPLE_RATE;
    modulatorPhase += (TWO_PI * frequency * 3.5) / SAMPLE_RATE;
    const modulationIndex = 2.2 * Math.exp(-t * 6);
    const envelope = Math.min(1, t / 0.002) * Math.exp(-t * decay);
    const sample = Math.sin(carrierPhase + modulationIndex * Math.sin(modulatorPhase)) * envelope * gain;
    track.left[startSample + i] += sample * leftGain;
    track.right[startSample + i] += sample * rightGain;
  }
};

// Impact: a sub drop from 100 Hz to 30 Hz, a mid thump and a dark noise burst, glued with saturation.
export const playImpact = (track, time, { gain = 1 } = {}) => {
  const { startSample, sampleCount } = sampleRange(track, time, 3);
  const lowpass = new StateVariableFilter(900);
  let subPhase = 0;
  let thumpPhase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    subPhase += (TWO_PI * (30 + 70 * Math.exp(-t * 3))) / SAMPLE_RATE;
    thumpPhase += (TWO_PI * (60 + 90 * Math.exp(-t * 25))) / SAMPLE_RATE;
    lowpass.process(noise());
    const sub = Math.sin(subPhase) * Math.exp(-t * 1.4);
    const thump = Math.sin(thumpPhase) * Math.exp(-t * 9) * 0.8;
    const rumble = lowpass.lowpass * Math.exp(-t * 7) * 3;
    const sample = Math.tanh((sub + thump + rumble) * 1.6) * Math.min(1, t / 0.002) * gain;
    track.left[startSample + i] += sample;
    track.right[startSample + i] += sample;
  }
};

// Riser: noise through a bandpass that sweeps up while the level swells, plus a quiet sine rising two
// octaves. It cuts off on the downbeat it leads into.
export const playRiser = (track, startTime, endTime, { gain = 1, fromCutoff = 300, toCutoff = 7000 } = {}) => {
  const durationSeconds = endTime - startTime;
  const { startSample, sampleCount } = sampleRange(track, startTime, durationSeconds + 0.02);
  const leftFilter = new StateVariableFilter(fromCutoff, 1.8);
  const rightFilter = new StateVariableFilter(fromCutoff, 1.8);
  let tonePhase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const progress = Math.min(1, t / durationSeconds);
    if (i % CONTROL_INTERVAL === 0) {
      const cutoff = fromCutoff * (toCutoff / fromCutoff) ** progress;
      leftFilter.setCutoff(cutoff);
      rightFilter.setCutoff(cutoff);
    }
    leftFilter.process(noise());
    rightFilter.process(noise());
    tonePhase += (TWO_PI * 220 * 2 ** (progress * 2)) / SAMPLE_RATE;
    const cutoffFade = t > durationSeconds ? Math.max(0, 1 - (t - durationSeconds) / 0.02) : 1;
    const level = gain * progress ** 2.5 * cutoffFade;
    const tone = Math.sin(tonePhase) * 0.08;
    track.left[startSample + i] += (leftFilter.bandpass * 2 + tone) * level;
    track.right[startSample + i] += (rightFilter.bandpass * 2 + tone) * level;
  }
};
