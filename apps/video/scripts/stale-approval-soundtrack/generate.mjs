import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStems } from './arrangement.mjs';
import {
  addTrack,
  createDuckingShape,
  createTrack,
  highpassTrack,
  renderPingPongDelay,
  renderReverb,
  scaleTrack,
  writeWav,
} from './dsp.mjs';

// Renders the stale approval explainer soundtrack (see arrangement.mjs for the musical concept),
// mixes it and encodes it to public/audio/stale-approval-explainer.m4a. Run from apps/video with:
//   node scripts/stale-approval-soundtrack/generate.mjs

const VIDEO_APP_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTPUT_PATH = join(VIDEO_APP_DIRECTORY, 'public', 'audio', 'stale-approval-explainer.m4a');

// A dotted eighth note at 150 BPM, so the echoes fall between the beats.
const DELAY_SECONDS = 0.3;

// Per track: level, reverb and delay sends, sidechain depth against the kick, and a low cut that
// keeps everything but the kick, bass and impacts out of the low end.
const MIX = {
  kick: { gain: 0.55 },
  snare: { gain: 0.9, reverb: 0.35 },
  cymbals: { gain: 0.35, reverb: 0.15 },
  percussion: { gain: 0.6, reverb: 0.2, highpass: 300 },
  bass: { gain: 0.3, duck: 0.35 },
  pads: { gain: 0.6, reverb: 0.35, duck: 0.5, highpass: 130 },
  plucks: { gain: 1.2, reverb: 0.2, delay: 0.35, duck: 0.3, highpass: 200 },
  bells: { gain: 0.7, reverb: 0.5, delay: 0.3, highpass: 250 },
  effects: { gain: 0.6, reverb: 0.35 },
};

const { tracks, kickTimes } = renderStems();
const master = mixDown(tracks, kickTimes);
limit(master);
encode(master);

function mixDown(stems, kickTriggerTimes) {
  const sampleCount = stems.kick.left.length;
  const dryMix = createTrack(sampleCount);
  const reverbSend = createTrack(sampleCount);
  const delaySend = createTrack(sampleCount);
  const duckingShape = createDuckingShape(sampleCount, kickTriggerTimes, { releaseSeconds: 0.16 });

  Object.entries(MIX).forEach(([name, settings]) => {
    const track = stems[name];
    if (settings.highpass) highpassTrack(track, settings.highpass);
    if (settings.duck) scaleTrack(track, (sampleIndex) => 1 - settings.duck * duckingShape[sampleIndex]);
    addTrack(dryMix, track, settings.gain);
    if (settings.reverb) addTrack(reverbSend, track, settings.gain * settings.reverb);
    if (settings.delay) addTrack(delaySend, track, settings.gain * settings.delay);
  });

  // The echoes also feed the reverb, so they bloom instead of repeating dry.
  const delayReturn = renderPingPongDelay(delaySend, { delaySeconds: DELAY_SECONDS, feedback: 0.38, damping: 0.35 });
  addTrack(reverbSend, delayReturn, 0.3);
  const reverbReturn = renderReverb(reverbSend, { roomSize: 0.82, damping: 0.5 });
  highpassTrack(reverbReturn, 200);

  const mix = createTrack(sampleCount);
  addTrack(mix, dryMix);
  addTrack(mix, delayReturn, 0.8);
  addTrack(mix, reverbReturn, 0.9);
  highpassTrack(mix, 30);
  return mix;
}

// Soft limiting: drive the mix into tanh so the kick and impact peaks round off, then sit at
// -1.5 dBFS, which leaves room for the AAC encoder's overshoot.
function limit(mix) {
  const peak = mix.left.reduce((maximum, sample, i) => Math.max(maximum, Math.abs(sample), Math.abs(mix.right[i])), 0);
  const drive = 1.4 / peak;
  const outputScale = 0.84 / Math.tanh(1.4);
  for (let i = 0; i < mix.left.length; i++) {
    mix.left[i] = Math.tanh(mix.left[i] * drive) * outputScale;
    mix.right[i] = Math.tanh(mix.right[i] * drive) * outputScale;
  }
}

// Writes a temporary WAV and encodes it with Remotion's bundled ffmpeg, which does not infer the
// container from the .m4a extension, hence -f mp4.
function encode(mix) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'stale-approval-soundtrack-'));
  const wavPath = join(temporaryDirectory, 'soundtrack.wav');
  writeWav(wavPath, mix);
  execFileSync(
    'yarn',
    ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', wavPath, '-c:a', 'aac', '-b:a', '192k', '-f', 'mp4', OUTPUT_PATH],
    { cwd: VIDEO_APP_DIRECTORY, stdio: 'inherit' },
  );
  rmSync(temporaryDirectory, { recursive: true, force: true });
  console.log(`Wrote ${OUTPUT_PATH}`);
}
