// Web Audio API ocarina synthesizer utility
// Generates ocarina-like tones using oscillators with envelope shaping

export type OcarinaScale = "bass-low" | "bass" | "alto" | "soprano";

const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  F6: 1396.91,
  G6: 1567.98,
  A6: 1760.0,
  B6: 1975.53,
  C7: 2093.0,
};

export const SCALE_NOTES: Record<
  OcarinaScale,
  { label: string; frequency: number }[]
> = {
  "bass-low": [
    { label: "C3", frequency: NOTE_FREQUENCIES.C3 },
    { label: "D3", frequency: NOTE_FREQUENCIES.D3 },
    { label: "E3", frequency: NOTE_FREQUENCIES.E3 },
    { label: "F3", frequency: NOTE_FREQUENCIES.F3 },
    { label: "G3", frequency: NOTE_FREQUENCIES.G3 },
    { label: "A3", frequency: NOTE_FREQUENCIES.A3 },
    { label: "B3", frequency: NOTE_FREQUENCIES.B3 },
    { label: "C4", frequency: NOTE_FREQUENCIES.C4 },
  ],
  bass: [
    { label: "C4", frequency: NOTE_FREQUENCIES.C4 },
    { label: "D4", frequency: NOTE_FREQUENCIES.D4 },
    { label: "E4", frequency: NOTE_FREQUENCIES.E4 },
    { label: "F4", frequency: NOTE_FREQUENCIES.F4 },
    { label: "G4", frequency: NOTE_FREQUENCIES.G4 },
    { label: "A4", frequency: NOTE_FREQUENCIES.A4 },
    { label: "B4", frequency: NOTE_FREQUENCIES.B4 },
    { label: "C5", frequency: NOTE_FREQUENCIES.C5 },
  ],
  alto: [
    { label: "C5", frequency: NOTE_FREQUENCIES.C5 },
    { label: "D5", frequency: NOTE_FREQUENCIES.D5 },
    { label: "E5", frequency: NOTE_FREQUENCIES.E5 },
    { label: "F5", frequency: NOTE_FREQUENCIES.F5 },
    { label: "G5", frequency: NOTE_FREQUENCIES.G5 },
    { label: "A5", frequency: NOTE_FREQUENCIES.A5 },
    { label: "B5", frequency: NOTE_FREQUENCIES.B5 },
    { label: "C6", frequency: NOTE_FREQUENCIES.C6 },
  ],
  soprano: [
    { label: "C6", frequency: NOTE_FREQUENCIES.C6 },
    { label: "D6", frequency: NOTE_FREQUENCIES.D6 },
    { label: "E6", frequency: NOTE_FREQUENCIES.E6 },
    { label: "F6", frequency: NOTE_FREQUENCIES.F6 },
    { label: "G6", frequency: NOTE_FREQUENCIES.G6 },
    { label: "A6", frequency: NOTE_FREQUENCIES.A6 },
    { label: "B6", frequency: NOTE_FREQUENCIES.B6 },
    { label: "C7", frequency: NOTE_FREQUENCIES.C7 },
  ],
};

export const SCALE_LABELS: Record<OcarinaScale, string> = {
  "bass-low": "Bass Low C3–C4",
  bass: "Bass C4–C5",
  alto: "Alto C5–C6",
  soprano: "Soprano C6–C7",
};

export interface HoleDiagram {
  top: [boolean, boolean, boolean, boolean];
  bottom: [boolean, boolean, boolean, boolean];
  thumb: boolean;
}

export const HOLE_DIAGRAMS: HoleDiagram[] = [
  {
    top: [true, true, true, true],
    bottom: [true, true, true, true],
    thumb: true,
  },
  {
    top: [true, true, true, false],
    bottom: [true, true, true, true],
    thumb: true,
  },
  {
    top: [true, true, false, false],
    bottom: [true, true, true, true],
    thumb: true,
  },
  {
    top: [true, true, true, false],
    bottom: [true, true, true, false],
    thumb: true,
  },
  {
    top: [true, true, false, false],
    bottom: [true, true, false, false],
    thumb: true,
  },
  {
    top: [true, false, false, false],
    bottom: [true, true, false, false],
    thumb: true,
  },
  {
    top: [false, false, false, false],
    bottom: [true, true, false, false],
    thumb: false,
  },
  {
    top: [false, false, false, false],
    bottom: [false, false, false, false],
    thumb: false,
  },
];

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function shiftPitch(frequency: number, semitones: number): number {
  return frequency * 2 ** (semitones / 12);
}

export function playNote(frequency: number, duration = 0.5): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const attack = 0.05;
  const decay = 0.1;
  const sustainLevel = 0.55;
  const release = 0.2;
  const totalDuration = Math.max(duration, attack + decay + release + 0.05);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.7, now + attack);
  masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
  masterGain.gain.setValueAtTime(sustainLevel, now + totalDuration - release);
  masterGain.gain.linearRampToValueAtTime(0, now + totalDuration);
  masterGain.connect(ctx.destination);

  const sineOsc = ctx.createOscillator();
  sineOsc.type = "sine";
  sineOsc.frequency.setValueAtTime(frequency, now);
  const sineGain = ctx.createGain();
  sineGain.gain.setValueAtTime(0.7, now);
  sineOsc.connect(sineGain);
  sineGain.connect(masterGain);

  const triOsc = ctx.createOscillator();
  triOsc.type = "triangle";
  triOsc.frequency.setValueAtTime(frequency, now);
  const triGain = ctx.createGain();
  triGain.gain.setValueAtTime(0.25, now);
  triOsc.connect(triGain);
  triGain.connect(masterGain);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(5.5, now);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(frequency * 0.008, now);
  lfo.connect(lfoGain);
  lfoGain.connect(sineOsc.frequency);
  lfoGain.connect(triOsc.frequency);

  sineOsc.start(now);
  triOsc.start(now);
  lfo.start(now);
  sineOsc.stop(now + totalDuration);
  triOsc.stop(now + totalDuration);
  lfo.stop(now + totalDuration);
}

export function playDemo(scale: OcarinaScale): Promise<void> {
  const notes = SCALE_NOTES[scale];
  const noteDuration = 0.22;
  const noteGap = 0.25;
  const sequence = [...notes, ...notes.slice(0, -1).reverse()];
  const totalTime = sequence.length * noteGap * 1000;
  sequence.forEach((note, index) => {
    setTimeout(
      () => {
        playNote(note.frequency, noteDuration);
      },
      index * noteGap * 1000,
    );
  });
  return new Promise((resolve) => {
    setTimeout(resolve, totalTime + 300);
  });
}

export const PRESET_SONGS: {
  name: string;
  notes: { degree: number; beats: number }[];
}[] = [
  {
    name: "Happy Birthday",
    notes: [
      { degree: 0, beats: 0.75 },
      { degree: 0, beats: 0.25 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 0, beats: 0.75 },
      { degree: 0, beats: 0.25 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 2 },
      { degree: 0, beats: 0.75 },
      { degree: 0, beats: 0.25 },
      { degree: 7, beats: 1 },
      { degree: 5, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 6, beats: 0.75 },
      { degree: 6, beats: 0.25 },
      { degree: 5, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 2 },
    ],
  },
  {
    name: "Jingle Bells",
    notes: [
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 2, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 2, beats: 3 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 0.5 },
      { degree: 2, beats: 0.5 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 2 },
      { degree: 3, beats: 2 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 2, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 2, beats: 3 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 3 },
    ],
  },
  {
    name: "La Cucaracha",
    notes: [
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 4, beats: 2 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 2 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 4 },
    ],
  },
  {
    name: "Twinkle Twinkle",
    notes: [
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 5, beats: 1 },
      { degree: 5, beats: 1 },
      { degree: 4, beats: 2 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 2 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 2 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 2 },
      { degree: 0, beats: 1 },
      { degree: 0, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 4, beats: 1 },
      { degree: 5, beats: 1 },
      { degree: 5, beats: 1 },
      { degree: 4, beats: 2 },
      { degree: 3, beats: 1 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 2, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 1, beats: 1 },
      { degree: 0, beats: 2 },
    ],
  },
  {
    name: "Following the Sun",
    notes: [
      { degree: 2, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 0.5 },
      { degree: 2, beats: 0.5 },
      { degree: 1, beats: 0.5 },
      { degree: 2, beats: 1.5 },
      { degree: 4, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 2, beats: 2 },
      { degree: 2, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 5, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 2, beats: 0.5 },
      { degree: 1, beats: 2 },
      { degree: 2, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 5, beats: 2 },
      { degree: 5, beats: 0.5 },
      { degree: 5, beats: 0.5 },
      { degree: 6, beats: 0.5 },
      { degree: 5, beats: 0.5 },
      { degree: 4, beats: 1 },
      { degree: 3, beats: 2 },
      { degree: 4, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 5, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 3, beats: 1 },
      { degree: 2, beats: 2 },
      { degree: 3, beats: 0.5 },
      { degree: 4, beats: 0.5 },
      { degree: 5, beats: 1 },
      { degree: 4, beats: 0.5 },
      { degree: 3, beats: 0.5 },
      { degree: 2, beats: 3 },
    ],
  },
];

export function playMelody(
  scale: OcarinaScale,
  song: { degree: number; beats: number }[],
  onNoteChange: (
    noteLabel: string | null,
    songNoteIndex: number | null,
  ) => void,
  onComplete: () => void,
  options?: { tempoMultiplier?: number; pitchSemitones?: number },
): { cancel: () => void } {
  const tempoMult = options?.tempoMultiplier ?? 1.0;
  const pitchShift = options?.pitchSemitones ?? 0;

  const BPM = 120 * tempoMult;
  const msPerBeat = (60 / BPM) * 1000;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const scaleNotes = SCALE_NOTES[scale];
  let cursor = 0;

  song.forEach((note, songIdx) => {
    const startMs = cursor;
    const durationSec = note.beats * 0.45 * (1 / tempoMult);
    const noteIndex = Math.min(note.degree, scaleNotes.length - 1);
    const { label, frequency } = scaleNotes[noteIndex];
    const shiftedFreq =
      pitchShift !== 0 ? shiftPitch(frequency, pitchShift) : frequency;

    timers.push(
      setTimeout(() => {
        onNoteChange(label, songIdx);
        playNote(shiftedFreq, durationSec);
      }, startMs),
    );

    timers.push(
      setTimeout(
        () => {
          onNoteChange(null, null);
        },
        startMs + note.beats * msPerBeat * 0.9,
      ),
    );

    cursor += note.beats * msPerBeat;
  });

  const lastNote = song[song.length - 1];
  const totalMs = cursor + (lastNote ? lastNote.beats * msPerBeat * 0.1 : 0);
  timers.push(setTimeout(onComplete, totalMs));

  return {
    cancel: () => {
      for (const t of timers) clearTimeout(t);
    },
  };
}

export function getScaleFromProduct(
  shape: string,
  category: string,
): OcarinaScale {
  const combined = `${shape} ${category}`.toLowerCase();

  if (
    combined.includes("bass low") ||
    combined.includes("bass-low") ||
    combined.includes("basslow") ||
    combined.includes("contrabass") ||
    combined.includes("sub bass") ||
    combined.includes("c3")
  ) {
    return "bass-low";
  }
  if (
    combined.includes("soprano") ||
    combined.includes("c6") ||
    combined.includes("c7") ||
    combined.includes("piccolo") ||
    combined.includes("high")
  ) {
    return "soprano";
  }
  if (
    combined.includes("alto") ||
    combined.includes("c5") ||
    combined.includes("mid") ||
    combined.includes("medium")
  ) {
    return "alto";
  }
  if (
    combined.includes("bass") ||
    combined.includes("c4") ||
    combined.includes("low")
  ) {
    return "bass";
  }
  return "bass";
}
