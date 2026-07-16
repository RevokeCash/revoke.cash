import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Alternative soundtrack: a brighter, melodic take for comparison with the darker pulse-driven
// original (generate-soundtrack.mjs). Same scene cue points, but plucked arpeggios over an
// uplifting C-G-Am-F progression and a half-time groove with rim clicks instead of a
// four-on-the-floor kick. Standalone on purpose: whichever variant loses the comparison gets
// deleted together with its script. Regenerate with:
//   node scripts/generate-soundtrack-alternative.mjs

const SAMPLE_RATE = 44100;
const FPS = 30;
const TOTAL_FRAMES = 1272;
const DURATION_SECONDS = TOTAL_FRAMES / FPS;
const TOTAL_SAMPLES = Math.ceil(DURATION_SECONDS * SAMPLE_RATE);

// Scene start times from premium-announcement/Main.tsx (each scene starts 8 transition frames before the previous ends).
const REVEAL_AT = 254 / FPS;
const PREMIUM_AT = 346 / FPS;
const REVOKED_CHIME_AT = (608 + 175) / FPS;
const PRICING_AT = 930 / FPS;
const CTA_AT = 1132 / FPS;

const BPM = 110;
const BEAT = 60 / BPM;
const BAR = 4 * BEAT;

const leftChannel = new Float64Array(TOTAL_SAMPLES);
const rightChannel = new Float64Array(TOTAL_SAMPLES);

const TWO_PI = 2 * Math.PI;

// Detuned sine with a linear attack/release envelope; detune widens the stereo image.
const mixTone = ({
  startSeconds,
  durationSeconds,
  frequency,
  gain,
  attackSeconds,
  releaseSeconds,
  detune = 0.0012,
}) => {
  const startSample = Math.max(0, Math.floor(startSeconds * SAMPLE_RATE));
  const sampleCount = Math.min(Math.floor(durationSeconds * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const remaining = durationSeconds - t;
    const envelope = Math.max(0, Math.min(1, t / attackSeconds, remaining / releaseSeconds));
    leftChannel[startSample + i] += Math.sin(TWO_PI * frequency * (1 - detune) * t) * gain * envelope;
    rightChannel[startSample + i] += Math.sin(TWO_PI * frequency * (1 + detune) * t) * gain * envelope;
  }
};

// Plucked note: sine plus a fading second harmonic for a bright attack, exponential decay.
const mixPluck = ({ startSeconds, frequency, gain, decayRate = 7 }) => {
  const startSample = Math.max(0, Math.floor(startSeconds * SAMPLE_RATE));
  const sampleCount = Math.min(Math.floor(0.8 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * decayRate) * Math.min(1, t / 0.004);
    const fundamental = Math.sin(TWO_PI * frequency * t);
    const brightness = Math.sin(TWO_PI * frequency * 2 * t) * 0.4 * Math.exp(-t * 14);
    const sample = (fundamental + brightness) * gain * envelope;
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Bell-like tone with exponential decay, used for the success chime.
const mixBell = ({ startSeconds, frequency, gain, decayRate }) => {
  const startSample = Math.max(0, Math.floor(startSeconds * SAMPLE_RATE));
  const sampleCount = Math.min(Math.floor(3 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * decayRate) * Math.min(1, t / 0.005);
    const sample = Math.sin(TWO_PI * frequency * t) * gain * envelope;
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Soft kick: sine with a fast downward pitch sweep and exponential amplitude decay.
const mixKick = (startSeconds, gain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(0.3 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let phase = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const frequency = 42 + 90 * Math.exp(-t * 30);
    phase += (TWO_PI * frequency) / SAMPLE_RATE;
    const sample = Math.sin(phase) * gain * Math.exp(-t * 16);
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Rim click for the backbeat: a tiny noise snap with a short midrange blip.
const mixClick = (startSeconds, gain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(0.04 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let previousNoise = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const snap = (noise - previousNoise) * Math.exp(-t * 250);
    previousNoise = noise;
    const blip = Math.sin(TWO_PI * 900 * t) * Math.exp(-t * 120) * 0.6;
    const sample = (snap + blip) * gain;
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Short bright noise tick for offbeat hats (highpassed via first-order difference).
const mixHat = (startSeconds, gain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(0.05 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let previousNoise = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const highpassed = noise - previousNoise;
    previousNoise = noise;
    const sample = highpassed * gain * Math.exp(-t * 120);
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Airy hiss swell into the brand reveal: highpassed noise, so it reads bright rather than as a
// dark rumble.
const mixAirRiser = (startSeconds, durationSeconds, peakGain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(durationSeconds * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let previousNoise = 0;
  for (let i = 0; i < sampleCount; i++) {
    const progress = i / sampleCount;
    const noise = Math.random() * 2 - 1;
    const highpassed = noise - previousNoise;
    previousNoise = noise;
    const sample = highpassed * peakGain * progress * progress;
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

// Airy shimmer for the reveal moment (decaying filtered noise instead of a hard boom).
const mixShimmer = (startSeconds, gain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(1.2 * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let smoothed = 0;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    smoothed += (noise - smoothed) * 0.15;
    const sample = smoothed * gain * Math.exp(-t * 4) * Math.min(1, t / 0.01);
    leftChannel[startSample + i] += sample;
    rightChannel[startSample + i] += sample;
  }
};

const NOTE = {
  A1: 55.0,
  C2: 65.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  C3: 130.81,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.26,
  G5: 783.99,
  C6: 1046.5,
};

const mixPadChord = (startSeconds, durationSeconds, frequencies, { attackSeconds, releaseSeconds, gainScale = 1 }) => {
  frequencies.forEach((frequency, index) => {
    const gain = (index === 0 ? 0.055 : 0.04 - index * 0.006) * gainScale;
    mixTone({ startSeconds, durationSeconds, frequency, gain, attackSeconds, releaseSeconds });
  });
};

// --- Intro (hook + problem): calm Cadd9 pad with a sparse mid-register pluck figure, matching
// the bright character of the body instead of foreshadowing doom ---
mixPadChord(0, REVEAL_AT + 0.4, [NOTE.C3, NOTE.G3, NOTE.D4, NOTE.E4], { attackSeconds: 2.0, releaseSeconds: 1.2 });
const INTRO_PLUCK_MELODY = [NOTE.C4, NOTE.G3, NOTE.E4, NOTE.G3];
for (let pluckTime = 1.2, index = 0; pluckTime < REVEAL_AT - 1.2; pluckTime += 2 * BEAT, index++) {
  mixPluck({
    startSeconds: pluckTime,
    frequency: INTRO_PLUCK_MELODY[index % INTRO_PLUCK_MELODY.length],
    gain: 0.055,
    decayRate: 5,
  });
}
mixAirRiser(REVEAL_AT - 2.0, 2.0, 0.05);

// --- Brand reveal: soft landing instead of a boom ---
mixKick(REVEAL_AT, 0.35);
mixBell({ startSeconds: REVEAL_AT, frequency: NOTE.C3, gain: 0.14, decayRate: 3 });
mixShimmer(REVEAL_AT, 0.07);

// --- Body: uplifting C-G-Am-F progression, one chord per bar ---
const PROGRESSION = [
  { pad: [NOTE.C3, NOTE.G3, NOTE.E4], arp: [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E5] },
  { pad: [NOTE.G2, NOTE.B3, NOTE.D4], arp: [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.D5] },
  { pad: [NOTE.A2, NOTE.C4, NOTE.E4], arp: [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.E5] },
  { pad: [NOTE.F2, NOTE.A3, NOTE.C4], arp: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.C5] },
];
const chordAt = (seconds) => PROGRESSION[Math.max(0, Math.floor((seconds - REVEAL_AT) / BAR)) % PROGRESSION.length];

for (let index = 0; REVEAL_AT + index * BAR < CTA_AT; index++) {
  const chordStart = REVEAL_AT + index * BAR;
  mixPadChord(chordStart, Math.min(BAR + 0.3, CTA_AT - chordStart + 0.3), PROGRESSION[index % PROGRESSION.length].pad, {
    attackSeconds: 0.3,
    releaseSeconds: 0.5,
  });
}

// Plucked eighth-note arpeggios carry the melody from the Premium scene onward.
for (let arpTime = PREMIUM_AT, step = 0; arpTime < CTA_AT - 0.15; arpTime += BEAT / 2, step++) {
  const tones = chordAt(arpTime).arp;
  mixPluck({
    startSeconds: arpTime,
    frequency: tones[step % tones.length],
    gain: arpTime >= PRICING_AT ? 0.055 : 0.042,
  });
}

// Half-time groove: kick on beats 1 and 3, rim click on the backbeat.
for (let kickTime = PREMIUM_AT; kickTime < CTA_AT - 0.2; kickTime += 2 * BEAT) {
  mixKick(kickTime, kickTime >= PRICING_AT ? 0.36 : 0.3);
}
for (let clickTime = PREMIUM_AT + BEAT; clickTime < CTA_AT - 0.2; clickTime += 2 * BEAT) {
  mixClick(clickTime, 0.055);
}
for (let hatTime = PRICING_AT + BEAT / 2; hatTime < CTA_AT - 0.2; hatTime += BEAT) {
  mixHat(hatTime, 0.04);
}

// --- Success chime exactly when the USDT exploit flips to Revoked ---
mixBell({ startSeconds: REVOKED_CHIME_AT, frequency: NOTE.E5, gain: 0.09, decayRate: 3.5 });
mixBell({ startSeconds: REVOKED_CHIME_AT + 0.07, frequency: NOTE.G5, gain: 0.08, decayRate: 3.5 });
mixBell({ startSeconds: REVOKED_CHIME_AT + 0.14, frequency: NOTE.C6, gain: 0.07, decayRate: 3.5 });

// --- Outro (CTA): F resolving home to C, with a final high pluck ---
mixPadChord(CTA_AT - 0.05, 2.2, [NOTE.F2, NOTE.A3, NOTE.C4, NOTE.E4], { attackSeconds: 0.4, releaseSeconds: 0.8 });
mixPadChord(CTA_AT + 2.1, DURATION_SECONDS - CTA_AT - 2.1 + 0.1, [NOTE.C3, NOTE.E4, NOTE.G4, NOTE.C5], {
  attackSeconds: 0.5,
  releaseSeconds: 2.2,
  gainScale: 1.1,
});
mixPluck({ startSeconds: CTA_AT + 2.1, frequency: NOTE.C5, gain: 0.06, decayRate: 4 });

// --- Normalize and write a 16-bit stereo WAV ---
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  peak = Math.max(peak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
}
const normalization = 0.72 / peak;

const wavData = Buffer.alloc(44 + TOTAL_SAMPLES * 4);
wavData.write('RIFF', 0);
wavData.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
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
wavData.writeUInt32LE(TOTAL_SAMPLES * 4, 40);
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  wavData.writeInt16LE(Math.round(leftChannel[i] * normalization * 32767), 44 + i * 4);
  wavData.writeInt16LE(Math.round(rightChannel[i] * normalization * 32767), 44 + i * 4 + 2);
}

const outputPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'soundtrack-alternative.wav');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, wavData);

console.log(`Wrote ${outputPath} (${DURATION_SECONDS.toFixed(1)}s, peak normalized to 0.72)`);
console.log(
  'Encode with: yarn remotion ffmpeg -y -i public/audio/soundtrack-alternative.wav -c:a aac -b:a 192k -f mp4 public/audio/soundtrack-alternative.m4a',
);
