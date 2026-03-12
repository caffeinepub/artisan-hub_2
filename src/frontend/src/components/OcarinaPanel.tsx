import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  Music,
  Save,
  Square,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import type { OcarinaFingeringMap, OcarinaProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetOcarinaProfile,
  useSaveOcarinaProfile,
} from "../hooks/useQueries";
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
  productId: bigint;
  onClose: () => void;
}

// ─── Universal Tablature Icon definitions ─────────────────────────────────────

const TAB_ICONS: { id: string; label: string; svg: string }[] = [
  {
    id: "filled",
    label: "All closed",
    svg: `<circle cx="12" cy="12" r="8" fill="currentColor"/>`,
  },
  {
    id: "half-left",
    label: "Half left",
    svg: `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4 A8 8 0 0 0 12 20 Z" fill="currentColor"/>`,
  },
  {
    id: "half-right",
    label: "Half right",
    svg: `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4 A8 8 0 0 1 12 20 Z" fill="currentColor"/>`,
  },
  {
    id: "open",
    label: "All open",
    svg: `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  {
    id: "cross",
    label: "Cross finger",
    svg: `<line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  {
    id: "diamond",
    label: "Pinch note",
    svg: `<polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  },
];

function TabIconSvg({ iconId, size = 20 }: { iconId: string; size?: number }) {
  const icon = TAB_ICONS.find((i) => i.id === iconId) ?? TAB_ICONS[3];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled SVG shapes
      dangerouslySetInnerHTML={{ __html: icon.svg }}
      aria-label={icon.label}
    />
  );
}

// ─── Color themes per scale ───────────────────────────────────────────────────

const SCALE_THEMES: Record<
  OcarinaScale,
  {
    bg: string;
    border: string;
    noteBase: string;
    noteActive: string;
    label: string;
    holeActive: string;
    holeOpen: string;
    tabActive: string;
    tabPast: string;
    settingsBg: string;
  }
> = {
  "bass-low": {
    bg: "bg-purple-950/30",
    border: "border-purple-700/40",
    noteBase:
      "bg-purple-900/40 hover:bg-purple-800/60 border-purple-600/50 text-purple-100",
    noteActive:
      "bg-purple-500/80 border-purple-300 scale-95 shadow-purple-500/40 shadow-lg",
    label: "text-purple-300",
    holeActive: "bg-purple-400",
    holeOpen: "border-purple-600/60",
    tabActive: "border-purple-400 bg-purple-900/50 ring-1 ring-purple-400",
    tabPast: "border-white/10 opacity-20",
    settingsBg: "bg-purple-950/50",
  },
  bass: {
    bg: "bg-blue-950/30",
    border: "border-blue-700/40",
    noteBase:
      "bg-blue-900/40 hover:bg-blue-800/60 border-blue-600/50 text-blue-100",
    noteActive:
      "bg-blue-500/80 border-blue-300 scale-95 shadow-blue-500/40 shadow-lg",
    label: "text-blue-300",
    holeActive: "bg-blue-400",
    holeOpen: "border-blue-600/60",
    tabActive: "border-blue-400 bg-blue-900/50 ring-1 ring-blue-400",
    tabPast: "border-white/10 opacity-20",
    settingsBg: "bg-blue-950/50",
  },
  alto: {
    bg: "bg-teal-950/30",
    border: "border-teal-700/40",
    noteBase:
      "bg-teal-900/40 hover:bg-teal-800/60 border-teal-600/50 text-teal-100",
    noteActive:
      "bg-teal-500/80 border-teal-300 scale-95 shadow-teal-500/40 shadow-lg",
    label: "text-teal-300",
    holeActive: "bg-teal-400",
    holeOpen: "border-teal-600/60",
    tabActive: "border-teal-400 bg-teal-900/50 ring-1 ring-teal-400",
    tabPast: "border-white/10 opacity-20",
    settingsBg: "bg-teal-950/50",
  },
  soprano: {
    bg: "bg-amber-950/30",
    border: "border-amber-700/40",
    noteBase:
      "bg-amber-900/40 hover:bg-amber-800/60 border-amber-600/50 text-amber-100",
    noteActive:
      "bg-amber-500/80 border-amber-300 scale-95 shadow-amber-500/40 shadow-lg",
    label: "text-amber-300",
    holeActive: "bg-amber-400",
    holeOpen: "border-amber-600/60",
    tabActive: "border-amber-400 bg-amber-900/50 ring-1 ring-amber-400",
    tabPast: "border-white/10 opacity-20",
    settingsBg: "bg-amber-950/50",
  },
};

// ─── 4-Hole Tablature Diagram ─────────────────────────────────────────────────

export function FourHoleDiagram({
  holes,
  holeActive,
  holeOpen,
  size = "sm",
}: {
  holes: boolean[];
  holeActive: string;
  holeOpen: string;
  size?: "xs" | "sm" | "lg";
}) {
  const sizeMap = { xs: "w-2.5 h-2.5", sm: "w-3.5 h-3.5", lg: "w-5 h-5" };
  const gapMap = { xs: "gap-1", sm: "gap-1.5", lg: "gap-2" };
  const dotSize = sizeMap[size];
  const gap = gapMap[size];

  return (
    <div className={`grid grid-cols-2 ${gap}`}>
      {holes.map((covered, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-hole positions
          key={i}
          className={`${dotSize} rounded-full border-2 transition-colors ${
            covered
              ? `${holeActive} border-transparent`
              : `bg-transparent ${holeOpen} border-2`
          }`}
        />
      ))}
    </div>
  );
}

// ─── Duration label ───────────────────────────────────────────────────────────

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

// ─── Note Upload/Icon Picker Popover ─────────────────────────────────────────

function NoteEditorPopover({
  noteIndex,
  productId,
  theme,
  currentIconId,
  hasCustomAudio,
  onClose,
  onIconSet,
  onAudioUploaded,
  isAdmin,
}: {
  noteIndex: number;
  productId: bigint;
  theme: (typeof SCALE_THEMES)[OcarinaScale];
  currentIconId: string;
  hasCustomAudio: boolean;
  onClose: () => void;
  onIconSet: (iconId: string) => void;
  onAudioUploaded: () => void;
  isAdmin: boolean;
}) {
  const { actor } = useActor();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = async (file: File) => {
    if (!actor || !isAdmin) return;
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await actor.saveNoteAudio(productId, BigInt(noteIndex), blob);
      onAudioUploaded();
    } catch (err) {
      console.error("Audio upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleIconSelect = async (iconId: string) => {
    if (!actor || !isAdmin) return;
    try {
      await actor.saveNoteIcon(productId, BigInt(noteIndex), iconId);
      onIconSet(iconId);
    } catch (err) {
      console.error("Icon save error:", err);
    }
  };

  return (
    <div
      className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl border p-3 shadow-2xl backdrop-blur-sm ${
        theme.settingsBg
      } ${theme.border}`}
      data-ocid="ocarina.popover"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white/70 uppercase tracking-wide">
          Note {noteIndex + 1}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white/80"
          data-ocid="ocarina.close_button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Icon picker */}
      <div className="mb-3">
        <p className="text-xs text-white/50 mb-1.5">Tablature icon</p>
        <div className="grid grid-cols-3 gap-1.5">
          {TAB_ICONS.map((icon) => (
            <button
              type="button"
              key={icon.id}
              onClick={() => isAdmin && handleIconSelect(icon.id)}
              disabled={!isAdmin}
              title={icon.label}
              className={`flex items-center justify-center rounded-lg h-9 border-2 transition-all ${
                currentIconId === icon.id
                  ? "border-amber-400 bg-amber-900/40"
                  : "border-white/10 hover:border-white/30 bg-white/5"
              } ${!isAdmin ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-white">
                <TabIconSvg iconId={icon.id} size={16} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Audio upload */}
      {isAdmin && (
        <div>
          <p className="text-xs text-white/50 mb-1.5">
            {hasCustomAudio ? "✓ Custom audio" : "Upload audio"}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all disabled:opacity-50"
            data-ocid="ocarina.upload_button"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading…" : "Upload MP3/WAV"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAudioUpload(f);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Admin check hook ───────────────────────────────────────────────────────────────

function usePanelAdminCheck() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function OcarinaPanel({
  scale,
  productName,
  productId,
  onClose,
}: OcarinaPanelProps) {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: isAdminData } = usePanelAdminCheck();
  const isAdmin = isLoggedIn && (isAdminData ?? false);

  const { data: profile, refetch: refetchProfile } =
    useGetOcarinaProfile(productId);
  const saveProfileMutation = useSaveOcarinaProfile();

  // Local state — populated from profile on load
  const [customIcons, setCustomIcons] = useState<string[]>(Array(8).fill(""));
  const [customFingerMap, setCustomFingerMap] = useState<boolean[][]>(() =>
    HOLE_DIAGRAMS.map((d) => [...d.top]),
  );
  const [audioLoaded, setAudioLoaded] = useState<boolean[]>(
    Array(8).fill(false),
  );
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openEditorIdx, setOpenEditorIdx] = useState<number | null>(null);

  // Playback state
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [activeSongIdx, setActiveSongIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [currentSongNotes, setCurrentSongNotes] = useState<
    { degree: number; beats: number }[]
  >([]);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const cancelRef = useRef<{ cancel: () => void } | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const activeTabItemRef = useRef<HTMLDivElement>(null);

  const notes = SCALE_NOTES[scale];
  const theme = SCALE_THEMES[scale];

  // Load profile data into local state
  useEffect(() => {
    if (!profile) return;

    if (profile.iconMappings && profile.iconMappings.length > 0) {
      setCustomIcons((prev) => {
        const next = [...prev];
        profile.iconMappings!.forEach((iconId, idx) => {
          if (idx < 8 && iconId) next[idx] = iconId;
        });
        return next;
      });
    }

    const fm = profile.fingeringMap;
    if (fm) {
      const keys: (keyof OcarinaFingeringMap)[] = [
        "note0",
        "note1",
        "note2",
        "note3",
        "note4",
        "note5",
        "note6",
        "note7",
      ];
      setCustomFingerMap(keys.map((k) => [...fm[k]]));
    }

    if (profile.noteAudioBlobs && profile.noteAudioBlobs.length > 0) {
      const newLoaded = Array(8).fill(false);
      profile.noteAudioBlobs.forEach((blob, idx) => {
        if (idx < 8 && blob) {
          try {
            const url = blob.getDirectURL();
            if (url) {
              const audio = new Audio(url);
              audioRefs.current.set(idx, audio);
              newLoaded[idx] = true;
            }
          } catch (err) {
            console.warn(`Failed to load audio for note ${idx}:`, err);
          }
        }
      });
      setAudioLoaded(newLoaded);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const playNoteWithAudio = (noteIdx: number, frequency: number) => {
    const customAudio = audioRefs.current.get(noteIdx);
    if (customAudio) {
      customAudio.currentTime = 0;
      customAudio.play().catch(() => playNote(frequency, 0.6));
    } else {
      playNote(frequency, 0.6);
    }
  };

  const handleNotePress = (
    label: string,
    frequency: number,
    noteIdx: number,
  ) => {
    if (isPlaying) return;
    setActiveNote(label);
    playNoteWithAudio(noteIdx, frequency);
    setTimeout(() => setActiveNote(null), 350);
  };

  const handlePlaySong = (song: (typeof PRESET_SONGS)[0]) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayingSong(song.name);
    setCurrentSongNotes(song.notes);
    setActiveSongIdx(null);
    setCurrentBeat(null);
    cancelRef.current = playMelody(
      scale,
      song.notes,
      (noteLabel, songIdx) => {
        setActiveNote(noteLabel);
        setActiveSongIdx(songIdx);
        if (songIdx !== null) {
          setCurrentBeat(song.notes[songIdx]?.beats ?? null);
        } else {
          setCurrentBeat(null);
        }
      },
      () => {
        setIsPlaying(false);
        setPlayingSong(null);
        setActiveNote(null);
        setActiveSongIdx(null);
        setCurrentSongNotes([]);
        setCurrentBeat(null);
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
    setCurrentBeat(null);
  };

  const degreeToNoteLabel = (degree: number) => {
    const idx = Math.min(degree, notes.length - 1);
    return notes[idx].label;
  };

  const toggleHole = (noteIdx: number, holeIdx: number) => {
    setCustomFingerMap((prev) => {
      const next = prev.map((h) => [...h]);
      next[noteIdx][holeIdx] = !next[noteIdx][holeIdx];
      return next;
    });
  };

  const buildFingeringMap = (): OcarinaFingeringMap => ({
    note0: customFingerMap[0] ?? [],
    note1: customFingerMap[1] ?? [],
    note2: customFingerMap[2] ?? [],
    note3: customFingerMap[3] ?? [],
    note4: customFingerMap[4] ?? [],
    note5: customFingerMap[5] ?? [],
    note6: customFingerMap[6] ?? [],
    note7: customFingerMap[7] ?? [],
  });

  const handleSaveProfile = () => {
    const profileToSave: OcarinaProfile = {
      id: productId,
      scaleName: scale,
      fingeringMap: buildFingeringMap(),
      iconMappings: customIcons,
      noteDegreeMappings: notes.map((_, i) => BigInt(i)),
      noteAudioBlobs: undefined,
    };
    saveProfileMutation.mutate(profileToSave);
  };

  const getHolesForNote = (noteIdx: number): boolean[] => {
    return (
      customFingerMap[noteIdx] ??
      HOLE_DIAGRAMS[noteIdx]?.top ?? [false, false, false, false]
    );
  };

  return (
    <div
      className={`rounded-2xl border-2 p-4 md:p-5 mt-3 ${theme.bg} ${theme.border} backdrop-blur-sm`}
      data-ocid="ocarina.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className={`h-5 w-5 ${theme.label}`} />
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${theme.label}`}
            >
              {SCALE_LABELS[scale]}
            </p>
            <p className="text-sm font-medium text-white/70">{productName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <span className="text-[10px] text-white/30 italic hidden sm:inline">
              Profile loaded
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            aria-label="Close ocarina panel"
            data-ocid="ocarina.close_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Note Buttons ── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {notes.map((note, degreeIdx) => {
          const isActive = activeNote === note.label;
          const iconId = customIcons[degreeIdx];
          const holes = getHolesForNote(degreeIdx);
          return (
            <div key={note.label} className="relative group">
              <button
                type="button"
                onMouseDown={() =>
                  handleNotePress(note.label, note.frequency, degreeIdx)
                }
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleNotePress(note.label, note.frequency, degreeIdx);
                }}
                className={`
                  relative flex flex-col items-center justify-center w-full
                  rounded-xl border-2 py-3 px-1 cursor-pointer
                  transition-all duration-100 select-none gap-0.5
                  min-h-[72px]
                  ${isActive ? theme.noteActive : theme.noteBase}
                  ${isPlaying && !isActive ? "opacity-70" : ""}
                `}
                aria-label={`Play note ${note.label}`}
                data-ocid={`ocarina.note.button.${degreeIdx + 1}`}
              >
                {iconId ? (
                  <span
                    className={`${theme.label} w-5 h-5 flex items-center justify-center`}
                  >
                    <TabIconSvg iconId={iconId} size={18} />
                  </span>
                ) : (
                  <FourHoleDiagram
                    holes={holes}
                    holeActive={theme.holeActive}
                    holeOpen={theme.holeOpen}
                    size="xs"
                  />
                )}
                <span className="font-mono text-sm font-bold leading-none mt-0.5">
                  {note.label.replace(/\d/, "")}
                </span>
                <span className="font-mono text-[10px] opacity-50 leading-none">
                  {note.label.match(/\d/)?.[0]}
                </span>
                {audioLoaded[degreeIdx] && (
                  <span
                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${theme.holeActive}`}
                  />
                )}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl animate-ping bg-white/20 pointer-events-none" />
                )}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenEditorIdx((prev) =>
                      prev === degreeIdx ? null : degreeIdx,
                    )
                  }
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white/20"
                  aria-label={`Edit note ${note.label}`}
                  data-ocid={`ocarina.edit_button.${degreeIdx + 1}`}
                >
                  <Camera className="h-3 w-3 text-white/70" />
                </button>
              )}

              {openEditorIdx === degreeIdx && (
                <NoteEditorPopover
                  noteIndex={degreeIdx}
                  productId={productId}
                  theme={theme}
                  currentIconId={customIcons[degreeIdx]}
                  hasCustomAudio={audioLoaded[degreeIdx]}
                  onClose={() => setOpenEditorIdx(null)}
                  onIconSet={(id) => {
                    setCustomIcons((prev) => {
                      const next = [...prev];
                      next[degreeIdx] = id;
                      return next;
                    });
                    setOpenEditorIdx(null);
                  }}
                  onAudioUploaded={() => {
                    setAudioLoaded((prev) => {
                      const next = [...prev];
                      next[degreeIdx] = true;
                      return next;
                    });
                    refetchProfile();
                    setOpenEditorIdx(null);
                  }}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-white/30 mt-2 text-center">
        {notes[0].label} – {notes[notes.length - 1].label} · tap or click to
        play
      </p>

      {/* ── Horizontal Tablature Scroll Strip (visible during playback) ── */}
      {isPlaying && currentSongNotes.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 mb-2">
            <p
              className={`text-[10px] font-bold uppercase tracking-widest ${theme.label}`}
            >
              {playingSong}
            </p>
            {currentBeat !== null && activeNote && (
              <span className="text-[10px] text-white/40 font-mono">
                {activeNote} · {durationLabel(currentBeat)} {currentBeat}b
              </span>
            )}
          </div>
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
              const holes = getHolesForNote(degree);
              return (
                <div
                  key={`tab-${idx}-d${sNote.degree}-b${sNote.beats}`}
                  ref={isActive ? activeTabItemRef : undefined}
                  className={`
                    flex-shrink-0 flex flex-col items-center gap-1
                    px-2 py-2 rounded-lg border-2 transition-all duration-150
                    ${
                      isActive
                        ? theme.tabActive
                        : isPast
                          ? theme.tabPast
                          : "border-white/10 bg-white/5"
                    }
                  `}
                >
                  <FourHoleDiagram
                    holes={holes}
                    holeActive={theme.holeActive}
                    holeOpen={theme.holeOpen}
                    size="xs"
                  />
                  <span className="font-mono text-[10px] text-white/60">
                    {noteLabel.replace(/\d/, "")}
                    <span className="text-[8px] opacity-40">
                      {noteLabel.match(/\d/)?.[0]}
                    </span>
                  </span>
                  <span className="text-[9px] text-white/30">
                    {durationLabel(sNote.beats)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preset Songs ── */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${theme.label}`}
          >
            Preset Songs
          </p>
          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
              data-ocid="ocarina.button"
            >
              <Square className="h-3 w-3" /> Stop
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SONGS.map((song) => (
            <button
              type="button"
              key={song.name}
              onClick={() => handlePlaySong(song)}
              disabled={isPlaying}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${
                  playingSong === song.name
                    ? `${theme.noteActive} ring-1`
                    : `${theme.noteBase} hover:opacity-90`
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              data-ocid="ocarina.tab"
            >
              {song.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fingering & Audio Settings (admin expandable) ── */}
      {isAdmin && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors w-full"
            data-ocid="ocarina.toggle"
          >
            {settingsOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            ⚙ Fingering &amp; Audio
            {profile && (
              <span className="ml-auto text-[10px] text-white/30 italic font-normal">
                Auto-saved from profile
              </span>
            )}
          </button>

          {settingsOpen && (
            <div
              className={`mt-3 rounded-xl border p-3 ${theme.settingsBg} ${theme.border} space-y-2 max-h-64 overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-2">
                <p className="text-xs text-white/50">
                  Configure fingering for each note
                </p>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={saveProfileMutation.isPending}
                  className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-500 text-black"
                  data-ocid="ocarina.save_button"
                >
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save Map
                </Button>
              </div>

              {notes.map((note, noteIdx) => (
                <div
                  key={note.label}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <span
                    className={`font-mono text-sm font-bold w-8 text-center flex-shrink-0 ${theme.label}`}
                  >
                    {note.label.replace(/\d/, "")}
                    <span className="text-[10px] opacity-50">
                      {note.label.match(/\d/)?.[0]}
                    </span>
                  </span>

                  <div className="grid grid-cols-2 gap-1 flex-shrink-0">
                    {getHolesForNote(noteIdx).map((covered, holeIdx) => (
                      <button
                        type="button"
                        // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-hole positions
                        key={holeIdx}
                        onClick={() => toggleHole(noteIdx, holeIdx)}
                        className={`w-6 h-6 rounded-full border-2 transition-colors ${
                          covered
                            ? `${theme.holeActive} border-transparent`
                            : `bg-transparent ${theme.holeOpen} border-2`
                        }`}
                        aria-label={`Toggle hole ${holeIdx + 1} for note ${note.label}`}
                        data-ocid="ocarina.toggle"
                      />
                    ))}
                  </div>

                  <span
                    className={`text-[10px] ml-auto flex-shrink-0 ${
                      audioLoaded[noteIdx] ? "text-green-400" : "text-white/20"
                    }`}
                  >
                    {audioLoaded[noteIdx] ? "♫" : "—"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenEditorIdx((prev) =>
                        prev === noteIdx ? null : noteIdx,
                      )
                    }
                    className="text-white/40 hover:text-white/80 flex-shrink-0"
                    aria-label="Edit icon/audio"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
