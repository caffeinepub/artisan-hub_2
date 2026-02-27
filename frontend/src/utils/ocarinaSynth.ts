// Web Audio API ocarina synthesizer utility
// Generates ocarina-like tones using oscillators with envelope shaping

export type OcarinaScale = 'bass-low' | 'bass' | 'alto' | 'soprano';

// Equal temperament note frequencies (Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.0, B6: 1975.53,
  C7: 2093.0,
};

// Diatonic notes for each scale
export const SCALE_NOTES: Record<OcarinaScale, { label: string; frequency: number }[]> = {
  'bass-low': [
    { label: 'C3', frequency: NOTE_FREQUENCIES.C3 },
    { label: 'D3', frequency: NOTE_FREQUENCIES.D3 },
    { label: 'E3', frequency: NOTE_FREQUENCIES.E3 },
    { label: 'F3', frequency: NOTE_FREQUENCIES.F3 },
    { label: 'G3', frequency: NOTE_FREQUENCIES.G3 },
    { label: 'A3', frequency: NOTE_FREQUENCIES.A3 },
    { label: 'B3', frequency: NOTE_FREQUENCIES.B3 },
    { label: 'C4', frequency: NOTE_FREQUENCIES.C4 },
  ],
  bass: [
    { label: 'C4', frequency: NOTE_FREQUENCIES.C4 },
    { label: 'D4', frequency: NOTE_FREQUENCIES.D4 },
    { label: 'E4', frequency: NOTE_FREQUENCIES.E4 },
    { label: 'F4', frequency: NOTE_FREQUENCIES.F4 },
    { label: 'G4', frequency: NOTE_FREQUENCIES.G4 },
    { label: 'A4', frequency: NOTE_FREQUENCIES.A4 },
    { label: 'B4', frequency: NOTE_FREQUENCIES.B4 },
    { label: 'C5', frequency: NOTE_FREQUENCIES.C5 },
  ],
  alto: [
    { label: 'C5', frequency: NOTE_FREQUENCIES.C5 },
    { label: 'D5', frequency: NOTE_FREQUENCIES.D5 },
    { label: 'E5', frequency: NOTE_FREQUENCIES.E5 },
    { label: 'F5', frequency: NOTE_FREQUENCIES.F5 },
    { label: 'G5', frequency: NOTE_FREQUENCIES.G5 },
    { label: 'A5', frequency: NOTE_FREQUENCIES.A5 },
    { label: 'B5', frequency: NOTE_FREQUENCIES.B5 },
    { label: 'C6', frequency: NOTE_FREQUENCIES.C6 },
  ],
  soprano: [
    { label: 'C6', frequency: NOTE_FREQUENCIES.C6 },
    { label: 'D6', frequency: NOTE_FREQUENCIES.D6 },
    { label: 'E6', frequency: NOTE_FREQUENCIES.E6 },
    { label: 'F6', frequency: NOTE_FREQUENCIES.F6 },
    { label: 'G6', frequency: NOTE_FREQUENCIES.G6 },
    { label: 'A6', frequency: NOTE_FREQUENCIES.A6 },
    { label: 'B6', frequency: NOTE_FREQUENCIES.B6 },
    { label: 'C7', frequency: NOTE_FREQUENCIES.C7 },
  ],
};

export const SCALE_LABELS: Record<OcarinaScale, string> = {
  'bass-low': 'Bass Low C3–C4',
  bass: 'Bass C4–C5',
  alto: 'Alto C5–C6',
  soprano: 'Soprano C6–C7',
};

// Lazy-initialized AudioContext (created on first user interaction)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single ocarina-like tone at the given frequency.
 * Uses a blend of sine and triangle oscillators with ADSR envelope.
 */
export function playNote(frequency: number, duration = 0.5): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Attack, decay, sustain, release parameters
  const attack = 0.05;
  const decay = 0.1;
  const sustainLevel = 0.55;
  const release = 0.2;
  const totalDuration = Math.max(duration, attack + decay + release + 0.05);

  // Master gain node
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.7, now + attack);
  masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
  masterGain.gain.setValueAtTime(sustainLevel, now + totalDuration - release);
  masterGain.gain.linearRampToValueAtTime(0, now + totalDuration);
  masterGain.connect(ctx.destination);

  // Primary sine oscillator (ocarina fundamental)
  const sineOsc = ctx.createOscillator();
  sineOsc.type = 'sine';
  sineOsc.frequency.setValueAtTime(frequency, now);

  const sineGain = ctx.createGain();
  sineGain.gain.setValueAtTime(0.7, now);
  sineOsc.connect(sineGain);
  sineGain.connect(masterGain);

  // Secondary triangle oscillator (adds warmth/breathiness)
  const triOsc = ctx.createOscillator();
  triOsc.type = 'triangle';
  triOsc.frequency.setValueAtTime(frequency, now);

  const triGain = ctx.createGain();
  triGain.gain.setValueAtTime(0.25, now);
  triOsc.connect(triGain);
  triGain.connect(masterGain);

  // Subtle vibrato via LFO
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5.5, now);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(frequency * 0.008, now);
  lfo.connect(lfoGain);
  lfoGain.connect(sineOsc.frequency);
  lfoGain.connect(triOsc.frequency);

  // Start and stop all nodes
  sineOsc.start(now);
  triOsc.start(now);
  lfo.start(now);

  sineOsc.stop(now + totalDuration);
  triOsc.stop(now + totalDuration);
  lfo.stop(now + totalDuration);
}

/**
 * Play a short ascending then descending demo sequence for the given scale.
 * Returns a Promise that resolves when the sequence completes.
 */
export function playDemo(scale: OcarinaScale): Promise<void> {
  const notes = SCALE_NOTES[scale];
  const noteDuration = 0.22; // seconds per note
  const noteGap = 0.25; // time between note starts

  // Ascending then descending: C D E F G A B C B A G F E D C
  const sequence = [
    ...notes,
    ...notes.slice(0, -1).reverse(),
  ];

  const totalTime = sequence.length * noteGap * 1000;

  sequence.forEach((note, index) => {
    setTimeout(() => {
      playNote(note.frequency, noteDuration);
    }, index * noteGap * 1000);
  });

  return new Promise((resolve) => {
    setTimeout(resolve, totalTime + 300);
  });
}

/**
 * Determine the ocarina scale from a product's shape or category fields.
 * Maps known values to the four pitch ranges.
 */
export function getScaleFromProduct(shape: string, category: string): OcarinaScale {
  const combined = `${shape} ${category}`.toLowerCase();

  if (
    combined.includes('bass low') ||
    combined.includes('bass-low') ||
    combined.includes('basslow') ||
    combined.includes('contrabass') ||
    combined.includes('sub bass') ||
    combined.includes('c3')
  ) {
    return 'bass-low';
  }

  if (
    combined.includes('soprano') ||
    combined.includes('c6') ||
    combined.includes('c7') ||
    combined.includes('piccolo') ||
    combined.includes('high')
  ) {
    return 'soprano';
  }

  if (
    combined.includes('alto') ||
    combined.includes('c5') ||
    combined.includes('mid') ||
    combined.includes('medium')
  ) {
    return 'alto';
  }

  if (
    combined.includes('bass') ||
    combined.includes('c4') ||
    combined.includes('low')
  ) {
    return 'bass';
  }

  // Default assignment based on product id parity for variety
  return 'bass';
}
