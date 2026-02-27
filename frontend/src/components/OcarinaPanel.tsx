import { useState } from 'react';
import { X, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playNote, SCALE_NOTES, SCALE_LABELS, type OcarinaScale } from '../utils/ocarinaSynth';

interface OcarinaPanelProps {
  scale: OcarinaScale;
  productName: string;
  onClose: () => void;
}

// Color themes per scale for visual distinction
const SCALE_THEMES: Record<OcarinaScale, { bg: string; noteBase: string; noteActive: string; label: string }> = {
  'bass-low': {
    bg: 'bg-amber-950/10 border-amber-800/30',
    noteBase: 'bg-amber-900/20 hover:bg-amber-800/40 border-amber-700/50 text-amber-100',
    noteActive: 'bg-amber-700/60 scale-95',
    label: 'text-amber-300',
  },
  bass: {
    bg: 'bg-orange-950/10 border-orange-800/30',
    noteBase: 'bg-orange-900/20 hover:bg-orange-800/40 border-orange-700/50 text-orange-100',
    noteActive: 'bg-orange-700/60 scale-95',
    label: 'text-orange-300',
  },
  alto: {
    bg: 'bg-emerald-950/10 border-emerald-800/30',
    noteBase: 'bg-emerald-900/20 hover:bg-emerald-800/40 border-emerald-700/50 text-emerald-100',
    noteActive: 'bg-emerald-700/60 scale-95',
    label: 'text-emerald-300',
  },
  soprano: {
    bg: 'bg-sky-950/10 border-sky-800/30',
    noteBase: 'bg-sky-900/20 hover:bg-sky-800/40 border-sky-700/50 text-sky-100',
    noteActive: 'bg-sky-700/60 scale-95',
    label: 'text-sky-300',
  },
};

export default function OcarinaPanel({ scale, productName, onClose }: OcarinaPanelProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const notes = SCALE_NOTES[scale];
  const theme = SCALE_THEMES[scale];

  const handleNotePress = (label: string, frequency: number) => {
    setActiveNote(label);
    playNote(frequency, 0.6);
    setTimeout(() => setActiveNote(null), 300);
  };

  return (
    <div className={`rounded-xl border-2 p-5 mt-3 ${theme.bg} backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className={`h-5 w-5 ${theme.label}`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${theme.label}`}>
              {SCALE_LABELS[scale]}
            </p>
            <p className="text-sm font-medium text-foreground/80">{productName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close ocarina panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Note Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {notes.map((note) => (
          <button
            key={note.label}
            onMouseDown={() => handleNotePress(note.label, note.frequency)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleNotePress(note.label, note.frequency);
            }}
            className={`
              relative flex flex-col items-center justify-center
              rounded-lg border-2 py-4 px-2 cursor-pointer
              transition-all duration-100 select-none
              font-mono text-sm font-bold
              ${theme.noteBase}
              ${activeNote === note.label ? theme.noteActive : ''}
            `}
            aria-label={`Play note ${note.label}`}
          >
            <span className="text-base leading-none">{note.label.replace(/\d/, '')}</span>
            <span className="text-xs opacity-60 mt-1">{note.label.match(/\d/)?.[0]}</span>
            {activeNote === note.label && (
              <span className="absolute inset-0 rounded-lg animate-ping bg-white/20 pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Tap or click notes to play • {notes[0].label} to {notes[notes.length - 1].label}
      </p>
    </div>
  );
}
