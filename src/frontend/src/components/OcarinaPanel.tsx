import { Music, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type OcarinaScale,
  PRESET_SONGS,
  SCALE_LABELS,
  SCALE_NOTES,
  playMelody,
  playNote,
} from "../utils/ocarinaSynth";

interface OcarinaPanelProps {
  scale: OcarinaScale;
  productName: string;
  onClose: () => void;
}

// Color themes per scale for visual distinction
const SCALE_THEMES: Record<
  OcarinaScale,
  { bg: string; noteBase: string; noteActive: string; label: string }
> = {
  "bass-low": {
    bg: "bg-amber-950/10 border-amber-800/30",
    noteBase:
      "bg-amber-900/20 hover:bg-amber-800/40 border-amber-700/50 text-amber-100",
    noteActive: "bg-amber-700/60 scale-95",
    label: "text-amber-300",
  },
  bass: {
    bg: "bg-orange-950/10 border-orange-800/30",
    noteBase:
      "bg-orange-900/20 hover:bg-orange-800/40 border-orange-700/50 text-orange-100",
    noteActive: "bg-orange-700/60 scale-95",
    label: "text-orange-300",
  },
  alto: {
    bg: "bg-emerald-950/10 border-emerald-800/30",
    noteBase:
      "bg-emerald-900/20 hover:bg-emerald-800/40 border-emerald-700/50 text-emerald-100",
    noteActive: "bg-emerald-700/60 scale-95",
    label: "text-emerald-300",
  },
  soprano: {
    bg: "bg-sky-950/10 border-sky-800/30",
    noteBase:
      "bg-sky-900/20 hover:bg-sky-800/40 border-sky-700/50 text-sky-100",
    noteActive: "bg-sky-700/60 scale-95",
    label: "text-sky-300",
  },
};

export default function OcarinaPanel({
  scale,
  productName,
  onClose,
}: OcarinaPanelProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const cancelRef = useRef<{ cancel: () => void } | null>(null);

  const notes = SCALE_NOTES[scale];
  const theme = SCALE_THEMES[scale];

  // Cancel playback on unmount
  useEffect(() => {
    return () => {
      cancelRef.current?.cancel();
    };
  }, []);

  const handleNotePress = (label: string, frequency: number) => {
    // Don't allow manual taps during auto-play
    if (isPlaying) return;
    setActiveNote(label);
    playNote(frequency, 0.6);
    setTimeout(() => setActiveNote(null), 300);
  };

  const handlePlaySong = (song: (typeof PRESET_SONGS)[0]) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayingSong(song.name);
    cancelRef.current = playMelody(
      scale,
      song.notes,
      (noteLabel) => setActiveNote(noteLabel),
      () => {
        setIsPlaying(false);
        setPlayingSong(null);
        setActiveNote(null);
      },
    );
  };

  const handleStop = () => {
    cancelRef.current?.cancel();
    setIsPlaying(false);
    setPlayingSong(null);
    setActiveNote(null);
  };

  return (
    <div
      className={`rounded-xl border-2 p-5 mt-3 ${theme.bg} backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className={`h-5 w-5 ${theme.label}`} />
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${theme.label}`}
            >
              {SCALE_LABELS[scale]}
            </p>
            <p className="text-sm font-medium text-foreground/80">
              {productName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close ocarina panel"
          data-ocid="ocarina.close_button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Note Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {notes.map((note) => (
          <button
            type="button"
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
              ${activeNote === note.label ? theme.noteActive : ""}
              ${isPlaying ? "cursor-default" : ""}
            `}
            aria-label={`Play note ${note.label}`}
          >
            <span className="text-base leading-none">
              {note.label.replace(/\d/, "")}
            </span>
            <span className="text-xs opacity-60 mt-1">
              {note.label.match(/\d/)?.[0]}
            </span>
            {activeNote === note.label && (
              <span className="absolute inset-0 rounded-lg animate-ping bg-white/20 pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Tap or click notes to play • {notes[0].label} to{" "}
        {notes[notes.length - 1].label}
      </p>

      {/* Preset Songs */}
      <div
        className="mt-4 border-t border-white/10 pt-4"
        data-ocid="ocarina.songs.section"
      >
        <p
          className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.label}`}
        >
          Preset Melodies
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SONGS.map((song, i) => (
            <button
              type="button"
              key={song.name}
              data-ocid={`ocarina.song.button.${i + 1}`}
              disabled={isPlaying && playingSong !== song.name}
              onClick={() => handlePlaySong(song)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                ${
                  playingSong === song.name
                    ? `${theme.noteActive} border-current ${theme.label} ring-1 ring-current`
                    : isPlaying
                      ? `${theme.noteBase} opacity-40 cursor-not-allowed`
                      : `${theme.noteBase} hover:opacity-90`
                }
              `}
            >
              {playingSong === song.name ? "♪ " : ""}
              {song.name}
            </button>
          ))}
          {isPlaying && (
            <button
              type="button"
              data-ocid="ocarina.stop_button"
              onClick={handleStop}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/50 bg-red-900/20 text-red-300 hover:bg-red-800/40 transition-all duration-150"
            >
              ■ Stop
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Select a melody to auto-play with highlighted keys
        </p>
      </div>
    </div>
  );
}
