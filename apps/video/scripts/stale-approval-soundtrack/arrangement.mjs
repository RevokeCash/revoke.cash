import { createTrack, SAMPLE_RATE } from './dsp.mjs';
import {
  playBass,
  playBell,
  playClap,
  playClick,
  playCrash,
  playImpact,
  playKick,
  playPad,
  playPluck,
  playRiser,
  playShaker,
  playTick,
  playTom,
} from './instruments.mjs';

// The score of the stale approval explainer soundtrack, placed on the video's frame timeline.
//
// The story is about time: an approval is harmless until it is old and someone finds a use for it. So
// a clock runs through the whole track. It ticks slowly under the exploit hook, speeds up with the
// timeline's day counter and stops dead on the exploit. Once Revoke Ultimate keeps time for you, the
// same tick becomes the hi-hat of a calm groove. The threat is in D minor and the solution in F major,
// two keys with the same notes: the same approval with a different ending. One sound means "revoked"
// everywhere: a glass bell playing F, A and C.

const FPS = 30;

// Scene durations from src/stale-approval-explainer/StaleApprovalExplainer.tsx. Each scene starts 8
// transition frames before the previous one ends.
const SCENE_DURATIONS = [115, 210, 180, 125, 115];
const TRANSITION_FRAMES = 8;
const SCENE_STARTS = SCENE_DURATIONS.map((_, sceneIndex) =>
  SCENE_DURATIONS.slice(0, sceneIndex).reduce((total, duration) => total + duration - TRANSITION_FRAMES, 0),
);
const [HOOK, COMPARISON, SET_IT_ONCE, BEFORE_THE_EXPLOIT, CTA] = SCENE_STARTS;
export const TOTAL_FRAMES = SCENE_STARTS.at(-1) + SCENE_DURATIONS.at(-1);

// 150 BPM, felt in half time. A beat is exactly 12 frames, and nearly every cue in the video falls
// within a frame or two of this grid.
const BEAT = 12;
const EIGHTH = 6;
const SIXTEENTH = 3;
const roundToBeat = (frame) => Math.round(frame / BEAT) * BEAT;

// Cue frames, from the in-scene frames in each scene file.
const CUE = {
  tilesPulled: Array.from({ length: 8 }, (_, tileIndex) => HOOK + 46 + tileIndex * 4),
  magicEdenClosed: COMPARISON + 40,
  staleRevoked: COMPARISON + 110,
  exploit: COMPARISON + 144,
  notAffected: COMPARISON + 150,
  ruleToggled: SET_IT_ONCE + 32,
  activityRevoked: [98, 110, 122].map((frame) => SET_IT_ONCE + frame),
  ctaPill: CTA + 16,
};

// Musical sections start on the beat nearest to their scene cut.
const GROOVE_START = roundToBeat(SET_IT_ONCE);
const LIFT_START = roundToBeat(BEFORE_THE_EXPLOIT);
const CTA_DOWNBEAT = roundToBeat(CTA);

const NOTE = {
  F1: 29,
  Bb1: 34,
  C2: 36,
  D2: 38,
  E2: 40,
  F2: 41,
  A2: 45,
  D3: 50,
  E3: 52,
  F3: 53,
  G3: 55,
  A3: 57,
  Bb3: 58,
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  Bb4: 70,
  C5: 72,
  D5: 74,
  E5: 76,
  F5: 77,
  G5: 79,
  A5: 81,
  C6: 84,
  F6: 89,
};

const REVOKED_MOTIF = [NOTE.F5, NOTE.A5, NOTE.C6];

// From the product scene to the end, the music moves in bars of 4 or 2 beats; the 2-beat bars keep
// every scene change on a downbeat.
const BARS = [
  // Product scene: F, C/E and Dm7 over a falling bass line, then a short Bb push.
  {
    section: 'groove',
    beats: 4,
    bass: NOTE.F2,
    pad: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.G4],
    arpeggio: [NOTE.F4, NOTE.C5, NOTE.A4, NOTE.C5, NOTE.G5, NOTE.C5, NOTE.A4, NOTE.C5],
  },
  {
    section: 'groove',
    beats: 4,
    bass: NOTE.E2,
    pad: [NOTE.E3, NOTE.G3, NOTE.C4, NOTE.G4],
    arpeggio: [NOTE.E4, NOTE.C5, NOTE.G4, NOTE.C5, NOTE.D5, NOTE.C5, NOTE.G4, NOTE.C5],
  },
  {
    section: 'groove',
    beats: 4,
    bass: NOTE.D2,
    pad: [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4],
    arpeggio: [NOTE.D4, NOTE.A4, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.F4, NOTE.A4],
  },
  {
    section: 'groove',
    beats: 2,
    bass: NOTE.Bb1,
    pad: [NOTE.D3, NOTE.F3, NOTE.Bb3, NOTE.C4],
    arpeggio: [NOTE.D4, NOTE.Bb4, NOTE.F4, NOTE.Bb4],
  },
  // The takeaway: the drums step back under Bbmaj9, then Csus4 and C lead towards the CTA.
  {
    section: 'lift',
    beats: 4,
    bass: NOTE.Bb1,
    pad: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.D4],
    arpeggio: [NOTE.D5, NOTE.F5, NOTE.A5, NOTE.F5],
  },
  { section: 'lift', beats: 2, bass: NOTE.C2, pad: [NOTE.F3, NOTE.G3, NOTE.C4, NOTE.D4], arpeggio: [NOTE.C5, NOTE.F5] },
  { section: 'lift', beats: 2, bass: NOTE.C2, pad: [NOTE.E3, NOTE.G3, NOTE.C4, NOTE.D4], arpeggio: [NOTE.C5, NOTE.G5] },
  // The clock speeds up again, but this time towards the payoff.
  {
    section: 'build',
    beats: 2,
    bass: NOTE.C2,
    pad: [NOTE.E3, NOTE.G3, NOTE.C4, NOTE.D4, NOTE.G4],
    arpeggio: [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6],
  },
  // CTA: home on F, then a plagal Bb before the final F.
  {
    section: 'cta',
    beats: 4,
    bass: NOTE.F2,
    pad: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.G4, NOTE.C5],
    arpeggio: [NOTE.F4, NOTE.C5, NOTE.A4, NOTE.C5, NOTE.G5, NOTE.C5, NOTE.A4, NOTE.C5],
  },
  {
    section: 'cta',
    beats: 2,
    bass: NOTE.Bb1,
    pad: [NOTE.F3, NOTE.Bb3, NOTE.C4, NOTE.D4],
    arpeggio: [NOTE.D5, NOTE.Bb4, NOTE.F5, NOTE.Bb4],
  },
];

const SECTION_STYLE = {
  groove: { padGain: 0.3, padCutoff: 1500, arpeggioStep: EIGHTH, arpeggioGain: 0.3, brightness: 0.55 },
  lift: { padGain: 0.36, padCutoff: 2400, arpeggioStep: BEAT, arpeggioGain: 0.28, brightness: 0.45 },
  build: { padGain: 0.36, padCutoff: 2400, arpeggioStep: EIGHTH, arpeggioGain: 0.3, brightness: 0.7 },
  cta: { padGain: 0.36, padCutoff: 3200, arpeggioStep: EIGHTH, arpeggioGain: 0.34, brightness: 0.9 },
};

// Renders every part into its own track. The kick times are returned for the sidechain ducking.
export const renderStems = () => {
  const sampleCount = Math.ceil((TOTAL_FRAMES / FPS) * SAMPLE_RATE);
  const tracks = {
    kick: createTrack(sampleCount),
    snare: createTrack(sampleCount),
    cymbals: createTrack(sampleCount),
    percussion: createTrack(sampleCount),
    bass: createTrack(sampleCount),
    pads: createTrack(sampleCount),
    plucks: createTrack(sampleCount),
    bells: createTrack(sampleCount),
    effects: createTrack(sampleCount),
  };
  const kickTimes = [];

  playHook(tracks);
  playClock(tracks);
  playTimeline(tracks);
  playExploit(tracks);
  playBars(tracks, kickTimes);
  playProductCues(tracks);
  playEnding(tracks, kickTimes);

  return { tracks, kickTimes };
};

const toSeconds = (frame) => frame / FPS;

const range = (startFrame, endFrame, step) =>
  Array.from({ length: Math.ceil((endFrame - startFrame) / step) }, (_, index) => startFrame + index * step);

const playRevokedMotif = (tracks, frame, { notes = REVOKED_MOTIF, spacingSeconds = 0.035, gain = 0.3 } = {}) => {
  notes.forEach((note, noteIndex) => {
    playBell(tracks.bells, toSeconds(frame) + noteIndex * spacingSeconds, note, {
      gain: gain * (1 - noteIndex * 0.15),
      pan: (noteIndex - 1) * 0.3,
    });
  });
};

// The exploit hook stays understated, so the exploit hit later on is the one dramatic moment: the
// clock starts on the first frame, a soft D minor pad fades in and slowly opens up until the exploit,
// and each NFT tile that gets pulled plays a falling glass note, panned left to right like the tiles.
function playHook(tracks) {
  playPad(tracks.pads, 0, toSeconds(CUE.exploit), [NOTE.D2, NOTE.A2, NOTE.F3, NOTE.A3, NOTE.E4], {
    gain: 0.38,
    attackSeconds: 1.5,
    releaseSeconds: 0.06,
    cutoff: 500,
    cutoffEnd: 2600,
  });

  const fallingNotes = [NOTE.A5, NOTE.G5, NOTE.F5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.Bb4, NOTE.A4];
  CUE.tilesPulled.forEach((frame, tileIndex) => {
    playBell(tracks.bells, toSeconds(frame), fallingNotes[tileIndex], {
      gain: 0.16,
      decay: 4,
      glideSemitones: 1,
      pan: -0.6 + (tileIndex * 1.2) / 7,
    });
  });
}

// The clock: a tick-tock every two beats from the first frame, every beat once the approval starts
// ageing, and every eighth note while the last days run out. It stops dead on the exploit.
function playClock(tracks) {
  const agingStart = CUE.magicEdenClosed + 9;
  const tickFrames = [
    ...range(0, agingStart, 2 * BEAT),
    ...range(agingStart, CUE.staleRevoked - 1, BEAT),
    ...range(CUE.staleRevoked - 1, CUE.exploit - 2, EIGHTH),
  ];
  tickFrames.forEach((frame, tickIndex) => {
    playTick(tracks.percussion, toSeconds(frame), {
      gain: 0.45 + 0.35 * (frame / CUE.exploit),
      pitch: tickIndex % 2 === 0 ? 1 : 0.78,
      pan: tickIndex % 2 === 0 ? -0.25 : 0.25,
    });
  });
}

// The timeline: a thud when Magic Eden's closing date lands, a pulsing D bass that opens up while
// the days count, the revoked motif when stale cleanup revokes the lower track, and a swell into the
// exploit.
function playTimeline(tracks) {
  playTom(tracks.effects, toSeconds(CUE.magicEdenClosed), { gain: 0.5 });

  const pulseStart = CUE.magicEdenClosed + 9;
  range(pulseStart, CUE.exploit - 2, EIGHTH).forEach((frame) => {
    const progress = (frame - pulseStart) / (CUE.exploit - pulseStart);
    playBass(tracks.bass, toSeconds(frame), toSeconds(4), NOTE.D2, {
      gain: 0.3 + 0.4 * progress,
      cutoff: 250 + 900 * progress,
    });
  });

  playRevokedMotif(tracks, CUE.staleRevoked);
  playRiser(tracks.effects, toSeconds(CUE.staleRevoked + 16), toSeconds(CUE.exploit), { gain: 0.5 });
}

// The exploit: one heavy hit and everything else stops. "Not affected" answers with the top of the
// revoked motif, and a Bb chord fades in as relief before handing over to the groove's F (IV to I).
function playExploit(tracks) {
  playImpact(tracks.effects, toSeconds(CUE.exploit), { gain: 1 });
  playBell(tracks.bells, toSeconds(CUE.notAffected), NOTE.A5, { gain: 0.22, decay: 2 });
  playBell(tracks.bells, toSeconds(CUE.notAffected) + 0.05, NOTE.C6, { gain: 0.17, decay: 2, pan: 0.2 });

  const reliefStart = CUE.exploit + 17;
  playPad(
    tracks.pads,
    toSeconds(reliefStart),
    toSeconds(GROOVE_START - reliefStart),
    [NOTE.D3, NOTE.F3, NOTE.Bb3, NOTE.C4],
    {
      gain: 0.22,
      attackSeconds: 0.9,
      releaseSeconds: 0.3,
      cutoff: 700,
      cutoffEnd: 1400,
    },
  );
  playRiser(tracks.effects, toSeconds(GROOVE_START - 30), toSeconds(GROOVE_START), { gain: 0.45 });
}

// Everything from the product scene to the CTA: pads, bass, arpeggio and drums, bar by bar.
function playBars(tracks, kickTimes) {
  let barStart = GROOVE_START;
  BARS.forEach((bar) => {
    const barFrames = bar.beats * BEAT;
    const style = SECTION_STYLE[bar.section];
    playBarHarmony(tracks, bar, barStart, barFrames, style);
    playBarDrums(tracks, bar, barStart, kickTimes);
    barStart += barFrames;
  });
}

function playBarHarmony(tracks, bar, barStart, barFrames, style) {
  const isBuild = bar.section === 'build';
  playPad(tracks.pads, toSeconds(barStart), toSeconds(barFrames), bar.pad, {
    gain: style.padGain,
    attackSeconds: bar.section === 'lift' ? 0.3 : 0.05,
    releaseSeconds: 0.25,
    cutoff: style.padCutoff,
    cutoffEnd: isBuild ? style.padCutoff * 1.8 : style.padCutoff,
  });

  range(barStart, barStart + barFrames, style.arpeggioStep).forEach((frame, stepIndex) => {
    playPluck(tracks.plucks, toSeconds(frame), bar.arpeggio[stepIndex % bar.arpeggio.length], {
      gain: style.arpeggioGain * (stepIndex % 2 === 0 ? 1 : 0.75),
      brightness: style.brightness,
      pan: stepIndex % 2 === 0 ? -0.3 : 0.3,
    });
  });

  // The lift holds long bass notes; the build pulses in eighths like the timeline did; the groove and
  // the CTA play a syncopated line with an octave pickup.
  if (bar.section === 'lift') {
    playBass(tracks.bass, toSeconds(barStart), toSeconds(barFrames - 2), bar.bass, { gain: 0.8, cutoff: 350 });
  } else if (isBuild) {
    range(barStart, barStart + barFrames, EIGHTH).forEach((frame, pulseIndex) => {
      playBass(tracks.bass, toSeconds(frame), toSeconds(4), bar.bass, {
        gain: 0.5 + pulseIndex * 0.06,
        cutoff: 500 + pulseIndex * 150,
      });
    });
  } else if (bar.beats === 4) {
    playBass(tracks.bass, toSeconds(barStart), toSeconds(20), bar.bass, { gain: 0.85 });
    playBass(tracks.bass, toSeconds(barStart + 30), toSeconds(10), bar.bass, { gain: 0.75 });
    playBass(tracks.bass, toSeconds(barStart + 42), toSeconds(5), bar.bass + 12, { gain: 0.6 });
  } else {
    playBass(tracks.bass, toSeconds(barStart), toSeconds(10), bar.bass, { gain: 0.85 });
    playBass(tracks.bass, toSeconds(barStart + 18), toSeconds(5), bar.bass, { gain: 0.7 });
  }
}

// Half-time drums: kick on 1 and the "and" of 3, clap on 3. The clock keeps ticking on every beat as
// the hi-hat, with a shaker on the off-beats.
function playBarDrums(tracks, bar, barStart, kickTimes) {
  const kick = (frame, gain = 1) => {
    playKick(tracks.kick, toSeconds(frame), { gain });
    kickTimes.push(toSeconds(frame));
  };
  const clapRoll = (fromFrame, count, fromGain, toGain) => {
    range(fromFrame, fromFrame + count * SIXTEENTH, SIXTEENTH).forEach((frame, hitIndex) => {
      playClap(tracks.snare, toSeconds(frame), { gain: fromGain + ((toGain - fromGain) * hitIndex) / (count - 1) });
    });
  };
  const barFrames = bar.beats * BEAT;

  const tickStep = bar.section === 'build' ? EIGHTH : BEAT;
  range(barStart, barStart + barFrames, tickStep).forEach((frame, tickIndex) => {
    playTick(tracks.percussion, toSeconds(frame), {
      gain: bar.section === 'lift' ? 0.3 : 0.4,
      pitch: tickIndex % 2 === 0 ? 1 : 0.78,
      pan: tickIndex % 2 === 0 ? -0.25 : 0.25,
    });
  });

  if (bar.section === 'lift') {
    kick(barStart, 0.8);
    if (barStart === LIFT_START) playCrash(tracks.cymbals, toSeconds(barStart), { gain: 0.35, decaySeconds: 2 });
    return;
  }

  if (bar.section === 'build') {
    kick(barStart);
    clapRoll(barStart, 8, 0.15, 0.7);
    playRiser(tracks.effects, toSeconds(barStart - 2 * BEAT), toSeconds(CTA_DOWNBEAT), { gain: 0.5 });
    return;
  }

  if (barStart === CTA_DOWNBEAT) playCrash(tracks.cymbals, toSeconds(barStart), { gain: 0.6 });

  range(barStart + EIGHTH, barStart + barFrames, BEAT).forEach((frame) => {
    playShaker(tracks.percussion, toSeconds(frame), { gain: 0.25, pan: 0.35 });
  });

  if (bar.beats === 4) {
    kick(barStart);
    kick(barStart + 30, 0.8);
    playClap(tracks.snare, toSeconds(barStart + 24));
  } else if (bar.section === 'groove') {
    kick(barStart);
    clapRoll(barStart + BEAT, 4, 0.25, 0.7);
  } else {
    kick(barStart);
    playClap(tracks.snare, toSeconds(barStart + BEAT));
  }
}

// Product scene and CTA cues: a click on the rule toggle, the revoked motif spread over the three
// revokes in the activity feed, and the motif an octave up when the URL pill lands.
function playProductCues(tracks) {
  playClick(tracks.percussion, toSeconds(CUE.ruleToggled), { gain: 0.2 });
  CUE.activityRevoked.forEach((frame, revokeIndex) => {
    playBell(tracks.bells, toSeconds(frame), REVOKED_MOTIF[revokeIndex], { gain: 0.28, pan: (revokeIndex - 1) * 0.3 });
  });
  playRevokedMotif(tracks, CUE.ctaPill, { notes: [NOTE.A5, NOTE.C6, NOTE.F6], gain: 0.24 });
}

// The final hit on F, two bars after the CTA downbeat, with everything ringing out to the last frame.
function playEnding(tracks, kickTimes) {
  const finalHit = CTA_DOWNBEAT + 6 * BEAT;
  playKick(tracks.kick, toSeconds(finalHit));
  kickTimes.push(toSeconds(finalHit));
  playCrash(tracks.cymbals, toSeconds(finalHit), { gain: 0.55, decaySeconds: 2 });
  playClap(tracks.snare, toSeconds(finalHit), { gain: 0.6 });
  playBass(tracks.bass, toSeconds(finalHit), 1, NOTE.F2, { gain: 0.85, cutoff: 400 });
  playBass(tracks.bass, toSeconds(finalHit), 1, NOTE.F1, { gain: 0.4, cutoff: 300 });
  playPad(tracks.pads, toSeconds(finalHit), 0.15, [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4, NOTE.A4], {
    gain: 0.4,
    attackSeconds: 0.01,
    releaseSeconds: 1.3,
    cutoff: 3500,
    cutoffEnd: 1200,
  });
  playRevokedMotif(tracks, finalHit, { spacingSeconds: 0, gain: 0.22 });
}
