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

// Scene start times from premium-announcement/Main.tsx (each scene starts 8 transition frames before the previous ends).
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

// --- Bed (whole track through pricing): F C G Am progression from the very top, so the open is
// energetic rather than eerie. The intro plays the cycle once, stretched so that its last chord
// ends exactly when the title card starts; the body restarts the progression on that downbeat. ---
const PROGRESSION = [
  [NOTE.F2, NOTE.F3, NOTE.A3, NOTE.C4],
  [NOTE.C3, NOTE.G3, NOTE.C4, NOTE.E4],
  [NOTE.G2, NOTE.G3, NOTE.B3, NOTE.D4],
  [NOTE.A2, NOTE.A3, NOTE.C4, NOTE.E4],
];
const CHORD_SECONDS = 2.0;
const INTRO_CHORD_SECONDS = REVEAL_AT / PROGRESSION.length;

const mixChordWithBassPulses = (chordStart, chordSeconds, chord, attackSeconds) => {
  mixPadChord(chordStart, Math.min(chordSeconds + 0.3, CTA_AT - chordStart + 0.3), chord, {
    attackSeconds,
    releaseSeconds: 0.5,
  });
  // Root-note bass pulses on the half notes keep the low end moving between kicks.
  [0, chordSeconds / 2].forEach((offset, pulseIndex) => {
    mixTone({
      startSeconds: chordStart + offset,
      durationSeconds: 0.45,
      frequency: chord[0],
      gain: pulseIndex === 0 ? 0.07 : 0.06,
      attackSeconds: 0.02,
      releaseSeconds: 0.35,
      detune: 0,
    });
  });
};

PROGRESSION.forEach((chord, index) => {
  // The very first chord fades in over a bar so the track doesn't click on, but still arrives fast.
  mixChordWithBassPulses(index * INTRO_CHORD_SECONDS, INTRO_CHORD_SECONDS, chord, index === 0 ? 0.8 : 0.35);
});
for (let index = 0; REVEAL_AT + index * CHORD_SECONDS < CTA_AT; index++) {
  const chordStart = REVEAL_AT + index * CHORD_SECONDS;
  mixChordWithBassPulses(chordStart, CHORD_SECONDS, PROGRESSION[index % PROGRESSION.length], 0.35);
}

// --- Brand-reveal impact ---
mixKick(REVEAL_AT, 0.5);
mixBell({ startSeconds: REVEAL_AT, frequency: NOTE.A1, gain: 0.22, decayRate: 3 });

// --- Drums: four-on-the-floor with offbeat hats from the title-card reveal, stepping up per scene ---
for (let kickTime = REVEAL_AT; kickTime < CTA_AT - 0.2; kickTime += 0.5) {
  // The reveal impact owns its own downbeat; skip the grid kick that would flam against it.
  if (Math.abs(kickTime - REVEAL_AT) > 0.3) {
    mixKick(kickTime, kickTime >= PRICING_AT ? 0.4 : kickTime >= PREMIUM_AT ? 0.32 : 0.26);
  }
  if (kickTime + 0.25 < CTA_AT - 0.2) {
    mixHat(kickTime + 0.25, kickTime >= PRICING_AT ? 0.05 : kickTime >= AUTO_REVOKE_AT ? 0.04 : 0.025);
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
  // Remotion's bundled ffmpeg does not infer the container from the .m4a extension, hence -f mp4.
  'Encode with: yarn remotion ffmpeg -y -i public/audio/soundtrack.wav -c:a aac -b:a 192k -f mp4 public/audio/soundtrack.m4a',
);
