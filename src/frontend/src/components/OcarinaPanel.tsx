import { Music, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  HOLE_DIAGRAMS,
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

// Color themes per scale
const SCALE_THEMES: Record<
  OcarinaScale,
  {
    bg: string;
    accent: string;
    noteBase: string;
    noteActive: string;
    label: string;
    holeActive: string;
    holeOpen: string;
    tabActive: string;
    tabPast: string;
  }
> = {
  "bass-low": {
    bg: "bg-amber-950/20 border-amber-800/40",
    accent: "bg-amber-800/30",
    noteBase:
      "bg-amber-900/30 hover:bg-amber-800/50 border-amber-700/60 text-amber-100",
    noteActive:
      "bg-amber-600/70 border-amber-400 scale-95 shadow-amber-500/30 shadow-lg",
    label: "text-amber-300",
    holeActive: "bg-amber-400",
    holeOpen: "border-amber-600/70",
    tabActive: "border-amber-400 bg-amber-900/40 ring-1 ring-amber-400",
    tabPast: "border-white/10 opacity-20",
  },
  bass: {
    bg: "bg-orange-950/20 border-orange-800/40",
    accent: "bg-orange-800/30",
    noteBase:
      "bg-orange-900/30 hover:bg-orange-800/50 border-orange-700/60 text-orange-100",
    noteActive:
      "bg-orange-600/70 border-orange-400 scale-95 shadow-orange-500/30 shadow-lg",
    label: "text-orange-300",
    holeActive: "bg-orange-400",
    holeOpen: "border-orange-600/70",
    tabActive: "border-orange-400 bg-orange-900/40 ring-1 ring-orange-400",
    tabPast: "border-white/10 opacity-20",
  },
  alto: {
    bg: "bg-emerald-950/20 border-emerald-800/40",
    accent: "bg-emerald-800/30",
    noteBase:
      "bg-emerald-900/30 hover:bg-emerald-800/50 border-emerald-700/60 text-emerald-100",
    noteActive:
      "bg-emerald-600/70 border-emerald-400 scale-95 shadow-emerald-500/30 shadow-lg",
    label: "text-emerald-300",
    holeActive: "bg-emerald-400",
    holeOpen: "border-emerald-600/70",
    tabActive: "border-emerald-400 bg-emerald-900/40 ring-1 ring-emerald-400",
    tabPast: "border-white/10 opacity-20",
  },
  soprano: {
    bg: "bg-sky-950/20 border-sky-800/40",
    accent: "bg-sky-800/30",
    noteBase:
      "bg-sky-900/30 hover:bg-sky-800/50 border-sky-700/60 text-sky-100",
    noteActive:
      "bg-sky-600/70 border-sky-400 scale-95 shadow-sky-500/30 shadow-lg",
    label: "text-sky-300",
    holeActive: "bg-sky-400",
    holeOpen: "border-sky-600/70",
    tabActive: "border-sky-400 bg-sky-900/40 ring-1 ring-sky-400",
    tabPast: "border-white/10 opacity-20",
  },
};

// ─── 4-Hole Tablature Diagram ─────────────────────────────────────────────────
// Simplified 4-hole view: just the top 4 holes of an 8-hole ocarina
// This matches the visual style of a standard ocarina tablature chart

function FourHoleDiagram({
  degree,
  holeActive,
  holeOpen,
  size = "sm",
}: {
  degree: number;
  holeActive: string;
  holeOpen: string;
  size?: "sm" | "xs" | "lg";
}) {
  const diagram = HOLE_DIAGRAMS[Math.min(degree, HOLE_DIAGRAMS.length - 1)];
  const sizeMap = { xs: "w-2.5 h-2.5", sm: "w-3.5 h-3.5", lg: "w-5 h-5" };
  const gapMap = { xs: "gap-1", sm: "gap-1.5", lg: "gap-2" };
  const dotSize = sizeMap[size];
  const gap = gapMap[size];

  const Dot = ({ covered }: { covered: boolean }) => (
    <div
      className={`${dotSize} rounded-full border-2 transition-colors ${
        covered
          ? `${holeActive} border-transparent`
          : `bg-transparent ${holeOpen} border-2`
      }`}
    />
  );

  return (
    <div className={`flex flex-row items-center ${gap}`}>
      {diagram.top.map((covered, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-hole positions
        <Dot key={i} covered={covered} />
      ))}
    </div>
  );
}

// ─── Duration label helper ────────────────────────────────────────────────────

function durationLabel(beats: number): string {
  if (beats >= 4) return "𝅝";
  if (beats >= 3) return "𝅗𝅥.";
  if (beats >= 2) return "𝅗𝅥";
  if (beats >= 1.5) return "𝅘𝅥𝅮.";
  if (beats >= 1) return "𝅘𝅥𝅮";
  if (beats >= 0.75) return "𝅘𝅥𝅯.";
  if (beats >= 0.5) return "𝅘𝅥𝅯";
  return "𝅘𝅥𝅰";
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function OcarinaPanel({
  scale,
  productName,
  onClose,
}: OcarinaPanelProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [activeSongIdx, setActiveSongIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [currentSongNotes, setCurrentSongNotes] = useState<
    { degree: number; beats: number }[]
  >([]);
  const cancelRef = useRef<{ cancel: () => void } | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const activeTabItemRef = useRef<HTMLDivElement>(null);

  const notes = SCALE_NOTES[scale];
  const theme = SCALE_THEMES[scale];

  useEffect(() => {
    return () => {
      cancelRef.current?.cancel();
    };
  }, []);

  // Auto-scroll tablature strip
  useEffect(() => {
    if (
      activeSongIdx !== null &&
      tabScrollRef.current &&
      activeTabItemRef.current
    ) {
      const container = tabScrollRef.current;
      const item = activeTabItemRef.current;
      container.scrollTo({
        left:
          item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeSongIdx]);

  const handleNotePress = (label: string, frequency: number) => {
    if (isPlaying) return;
    setActiveNote(label);
    playNote(frequency, 0.6);
    setTimeout(() => setActiveNote(null), 350);
  };

  const handlePlaySong = (song: (typeof PRESET_SONGS)[0]) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayingSong(song.name);
    setCurrentSongNotes(song.notes);
    setActiveSongIdx(null);
    cancelRef.current = playMelody(
      scale,
      song.notes,
      (noteLabel, songIdx) => {
        setActiveNote(noteLabel);
        setActiveSongIdx(songIdx);
      },
      () => {
        setIsPlaying(false);
        setPlayingSong(null);
        setActiveNote(null);
        setActiveSongIdx(null);
        setCurrentSongNotes([]);
      },
    );
  };

  const handleStop = () => {
    cancelRef.current?.cancel();
    setIsPlaying(false);
    setPlayingSong(null);
    setActiveNote(null);
    setActiveSongIdx(null);
    setCurrentSongNotes([]);
  };

  const degreeToNoteLabel = (degree: number) => {
    const idx = Math.min(degree, notes.length - 1);
    return notes[idx].label;
  };

  return (
    <div
      className={`rounded-2xl border-2 p-5 mt-3 ${theme.bg} backdrop-blur-sm`}
      data-ocid="ocarina.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Music className={`h-5 w-5 ${theme.label}`} />
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${theme.label}`}
            >
              {SCALE_LABELS[scale]}
            </p>
            <p className="text-sm font-medium text-foreground/70">
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

      {/* Note Buttons — clean style like Ocarina Composer */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {notes.map((note, degreeIdx) => {
          const isActive = activeNote === note.label;
          return (
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
                rounded-xl border-2 py-4 px-2 cursor-pointer
                transition-all duration-100 select-none gap-0.5
                ${isActive ? theme.noteActive : theme.noteBase}
                ${isPlaying && !isActive ? "opacity-70" : ""}
              `}
              aria-label={`Play note ${note.label}`}
              data-ocid={`ocarina.note.button.${degreeIdx + 1}`}
            >
              {/* Hole diagram above note name — 4 holes inline */}
              <FourHoleDiagram
                degree={degreeIdx}
                holeActive={theme.holeActive}
                holeOpen={theme.holeOpen}
                size="xs"
              />
              {/* Note name */}
              <span className="font-mono text-base font-bold leading-none mt-1">
                {note.label.replace(/\d/, "")}
              </span>
              <span className="font-mono text-[10px] opacity-50 leading-none">
                {note.label.match(/\d/)?.[0]}
              </span>
              {/* Active pulse ring */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl animate-ping bg-white/20 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center opacity-60">
        {notes[0].label} – {notes[notes.length - 1].label} · tap or click to
        play
      </p>

      {/* ── Horizontal Tablature Scroll Strip (visible during playback) ── */}
      {isPlaying && currentSongNotes.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p
            className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}
          >
            Tablature
          </p>
          <div
            ref={tabScrollRef}
            className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
            data-ocid="ocarina.tablature_strip"
          >
            {currentSongNotes.map((sNote, idx) => {
              const isActive = idx === activeSongIdx;
              const isPast = activeSongIdx !== null && idx < activeSongIdx;
              const degree = Math.min(sNote.degree, HOLE_DIAGRAMS.length - 1);
              const noteLabel = degreeToNoteLabel(sNote.degree);
              return (
                <div
                  key={`tab-${idx}-d${sNote.degree}-b${sNote.beats}`}
                  ref={isActive ? activeTabItemRef : undefined}
                  className={`
                    flex-shrink-0 flex flex-col items-center gap-1.5
                    rounded-lg border px-2.5 py-2
                    transition-all duration-150 min-w-[44px]
                    ${
                      isActive
                        ? theme.tabActive
                        : isPast
                          ? theme.tabPast
                          : "border-white/15 opacity-55"
                    }
                    ${isActive ? "scale-110" : ""}
                  `}
                >
                  {/* 4-hole tablature diagram */}
                  <FourHoleDiagram
                    degree={degree}
                    holeActive={isActive ? theme.holeActive : "bg-white/35"}
                    holeOpen={isActive ? theme.holeOpen : "border-white/20"}
                    size="xs"
                  />
                  {/* Note name */}
                  <span
                    className={`font-mono text-[11px] font-bold leading-none ${
                      isActive ? theme.label : "text-white/50"
                    }`}
                  >
                    {noteLabel.replace(/\d/, "")}
                    <sub className="text-[8px] opacity-50">
                      {noteLabel.match(/\d/)?.[0]}
                    </sub>
                  </span>
                  {/* Duration */}
                  <span className="text-[9px] opacity-40 leading-none">
                    {durationLabel(sNote.beats)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playback info bar */}
          {activeSongIdx !== null && currentSongNotes[activeSongIdx] && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={`font-semibold ${theme.label}`}>
                {activeSongIdx + 1}/{currentSongNotes.length}
              </span>
              <span className="opacity-30">·</span>
              <span>
                <span className={`font-mono font-bold ${theme.label}`}>
                  {activeNote ?? "—"}
                </span>
              </span>
              <span className="opacity-30">·</span>
              <span
                className={`font-mono font-bold ${theme.label} text-base leading-none`}
              >
                {durationLabel(currentSongNotes[activeSongIdx].beats)}
              </span>
              <span className="opacity-50">
                {currentSongNotes[activeSongIdx].beats}b
              </span>
            </div>
          )}
        </div>
      )}

      {/* Preset Songs */}
      <div
        className="mt-4 border-t border-white/10 pt-4"
        data-ocid="ocarina.songs.section"
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme.label}`}
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
              onClick={() =>
                playingSong === song.name ? handleStop() : handlePlaySong(song)
              }
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                ${
                  playingSong === song.name
                    ? `${theme.noteActive} border-current ${theme.label} ring-1 ring-current`
                    : isPlaying
                      ? `${theme.noteBase} opacity-30 cursor-not-allowed`
                      : `${theme.noteBase} hover:opacity-90`
                }
              `}
            >
              {playingSong === song.name ? (
                <span className="flex items-center gap-1">
                  <Square className="h-2.5 w-2.5 fill-current" />
                  Stop
                </span>
              ) : (
                <span>♪ {song.name}</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 opacity-50">
          Click a melody to auto-play · tablature scrolls with the music
        </p>
      </div>
    </div>
  );
}
