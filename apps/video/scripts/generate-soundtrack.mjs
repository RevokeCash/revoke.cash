import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Generates the announcement soundtrack: a minimal electronic bed timed to the Main composition's
// scene structure. Fully synthesized, so there are no licensing constraints. Regenerate with:
//   node scripts/generate-soundtrack.mjs
// then re-encode to m4a (see the console output at the end).

const SAMPLE_RATE = 44100;
const FPS = 30;
const TOTAL_FRAMES = 1272;
const DURATION_SECONDS = TOTAL_FRAMES / FPS;
const TOTAL_SAMPLES = Math.ceil(DURATION_SECONDS * SAMPLE_RATE);

// Scene start times from Main.tsx (each scene starts 8 transition frames before the previous ends).
const REVEAL_AT = 254 / FPS;
const PREMIUM_AT = 346 / FPS;
const AUTO_REVOKE_AT = 608 / FPS;
const REVOKED_CHIME_AT = (608 + 175) / FPS;
const PRICING_AT = 930 / FPS;
const CTA_AT = 1132 / FPS;

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

// Dark noise swell building into the brand-reveal impact.
const mixNoiseRiser = (startSeconds, durationSeconds, peakGain) => {
  const startSample = Math.floor(startSeconds * SAMPLE_RATE);
  const sampleCount = Math.min(Math.floor(durationSeconds * SAMPLE_RATE), TOTAL_SAMPLES - startSample);
  let smoothed = 0;
  for (let i = 0; i < sampleCount; i++) {
    const progress = i / sampleCount;
    const noise = Math.random() * 2 - 1;
    smoothed += (noise - smoothed) * 0.08;
    const sample = smoothed * peakGain * progress * progress;
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
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  C5: 523.25,
  E5: 659.26,
  G5: 783.99,
  C6: 1046.5,
};

const mixPadChord = (startSeconds, durationSeconds, frequencies, { attackSeconds, releaseSeconds, gainScale = 1 }) => {
  frequencies.forEach((frequency, index) => {
    // Lower notes carry the pad; upper voicings sit further back.
    const gain = (index === 0 ? 0.055 : 0.04 - index * 0.006) * gainScale;
    mixTone({ startSeconds, durationSeconds, frequency, gain, attackSeconds, releaseSeconds });
  });
};

// --- Intro (hook + problem): dark Am drone with a slow heartbeat and a riser into the reveal ---
mixPadChord(0, REVEAL_AT + 0.4, [NOTE.A2, NOTE.A3, NOTE.E4], { attackSeconds: 2.0, releaseSeconds: 1.2 });
for (let beat = 1.0; beat < REVEAL_AT - 0.6; beat += 2.0) {
  mixTone({
    startSeconds: beat,
    durationSeconds: 0.35,
    frequency: NOTE.A1,
    gain: 0.09,
    attackSeconds: 0.02,
    releaseSeconds: 0.3,
    detune: 0,
  });
}
mixNoiseRiser(REVEAL_AT - 2.2, 2.2, 0.09);

// --- Brand-reveal impact ---
mixKick(REVEAL_AT, 0.5);
mixBell({ startSeconds: REVEAL_AT, frequency: NOTE.A1, gain: 0.22, decayRate: 3 });

// --- Body (reveal through pricing): F C G Am progression with a soft four-on-the-floor pulse ---
const PROGRESSION = [
  [NOTE.F2, NOTE.F3, NOTE.A3, NOTE.C4],
  [NOTE.C3, NOTE.G3, NOTE.C4, NOTE.E4],
  [NOTE.G2, NOTE.G3, NOTE.B3, NOTE.D4],
  [NOTE.A2, NOTE.A3, NOTE.C4, NOTE.E4],
];
const CHORD_SECONDS = 2.0;
for (let index = 0; REVEAL_AT + index * CHORD_SECONDS < CTA_AT; index++) {
  const chordStart = REVEAL_AT + index * CHORD_SECONDS;
  const chord = PROGRESSION[index % PROGRESSION.length];
  mixPadChord(chordStart, Math.min(CHORD_SECONDS + 0.3, CTA_AT - chordStart + 0.3), chord, {
    attackSeconds: 0.35,
    releaseSeconds: 0.5,
  });
}
for (let kickTime = PREMIUM_AT; kickTime < CTA_AT - 0.2; kickTime += 0.5) {
  mixKick(kickTime, kickTime >= PRICING_AT ? 0.4 : 0.32);
  if (kickTime + 0.25 < CTA_AT - 0.2 && kickTime >= AUTO_REVOKE_AT) {
    mixHat(kickTime + 0.25, kickTime >= PRICING_AT ? 0.05 : 0.03);
  }
}

// --- Success chime exactly when the USDT exploit flips to Revoked ---
mixBell({ startSeconds: REVOKED_CHIME_AT, frequency: NOTE.E5, gain: 0.09, decayRate: 3.5 });
mixBell({ startSeconds: REVOKED_CHIME_AT + 0.07, frequency: NOTE.G5, gain: 0.08, decayRate: 3.5 });
mixBell({ startSeconds: REVOKED_CHIME_AT + 0.14, frequency: NOTE.C6, gain: 0.07, decayRate: 3.5 });

// --- Outro (CTA): resolve to a sustained C major, no more pulse ---
mixPadChord(CTA_AT - 0.1, DURATION_SECONDS - CTA_AT + 0.1, [NOTE.C2, NOTE.C3, NOTE.E4, NOTE.G4, NOTE.C5], {
  attackSeconds: 0.6,
  releaseSeconds: 2.2,
  gainScale: 1.1,
});

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

const outputPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'soundtrack.wav');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, wavData);

console.log(`Wrote ${outputPath} (${DURATION_SECONDS.toFixed(1)}s, peak normalized to 0.72)`);
console.log(
  'Encode with: yarn remotion ffmpeg -i public/audio/soundtrack.wav -c:a aac -b:a 192k public/audio/soundtrack.m4a -y',
);
