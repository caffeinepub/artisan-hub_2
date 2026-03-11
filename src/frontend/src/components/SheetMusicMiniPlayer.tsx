import { useEffect, useRef, useState } from "react";
import {
  HOLE_DIAGRAMS,
  type OcarinaScale,
  PRESET_SONGS,
  SCALE_NOTES,
  playMelody,
} from "../utils/ocarinaSynth";
import { FourHoleDiagram } from "./OcarinaPanel";

// ─── Staff Y positions for C5–C6 on treble clef ────────────────────────────
// 5 staff lines: y=50,40,30,20,10 (bottom to top)
// Degrees 0-7 map to C5,D5,E5,F5,G5,A5,B5,C6
const NOTE_STAFF_Y: Record<number, number> = {
  0: 25, // C5
  1: 20, // D5
  2: 15, // E5
  3: 10, // F5
  4: 5, // G5
  5: 0, // A5 (ledger line)
  6: -5, // B5
  7: -10, // C6 (ledger line)
};

const NOTE_COL_W = 36;
const SVG_HEIGHT = 95;
const SVG_PADDING_TOP = 30;

function StaffSVG({
  notes,
  activeIdx,
  scale,
}: {
  notes: { degree: number; beats: number }[];
  activeIdx: number | null;
  scale: OcarinaScale;
}) {
  const scaleNotes = SCALE_NOTES[scale];
  const totalW = Math.max(notes.length * NOTE_COL_W + 60, 400);
  const staffLines = [50, 40, 30, 20, 10];

  return (
    <svg
      role="img"
      width={totalW}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${totalW} ${SVG_HEIGHT}`}
    >
      <title>Sheet music staff</title>
      {/* Staff lines */}
      {staffLines.map((y) => (
        <line
          key={y}
          x1={10}
          y1={y + SVG_PADDING_TOP}
          x2={totalW - 10}
          y2={y + SVG_PADDING_TOP}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={0.8}
        />
      ))}

      {/* Treble clef symbol */}
      <text
        x={12}
        y={SVG_PADDING_TOP + 48}
        fontSize={52}
        fill="rgba(255,255,255,0.5)"
        fontFamily="serif"
      >
        {"\u{1D11E}"}
      </text>

      {/* Note columns */}
      {notes.map((note, i) => {
        // biome-ignore lint/suspicious/noArrayIndexKey: sequential note positions
        const x = 60 + i * NOTE_COL_W + NOTE_COL_W / 2;
        const rawY = NOTE_STAFF_Y[note.degree] ?? 25;
        const y = rawY + SVG_PADDING_TOP;
        const isCurrent = i === activeIdx;
        const isPast = activeIdx !== null && i < activeIdx;
        const noteLabel = scaleNotes[note.degree]?.label ?? "";

        let fill = "rgba(255,255,255,0.55)";
        let opacity = 0.7;
        if (isCurrent) {
          fill = "#F59E0B";
          opacity = 1;
        } else if (isPast) {
          fill = "rgba(255,255,255,0.15)";
          opacity = 0.35;
        }

        const middleY = 30 + SVG_PADDING_TOP;
        const stemUp = y >= middleY;
        const stemX = stemUp ? x + 5 : x - 5;
        const stemY1 = stemUp ? y - 3.5 : y + 3.5;
        const stemY2 = stemUp ? y - 26 : y + 26;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: sequential note positions
          <g key={i} opacity={opacity}>
            {/* Ledger line for A5 (degree 5) */}
            {note.degree === 5 && (
              <line
                x1={x - 9}
                y1={SVG_PADDING_TOP}
                x2={x + 9}
                y2={SVG_PADDING_TOP}
                stroke={fill}
                strokeWidth={1.2}
              />
            )}
            {/* Ledger line for C6 (degree 7) */}
            {note.degree === 7 && (
              <line
                x1={x - 9}
                y1={SVG_PADDING_TOP - 10}
                x2={x + 9}
                y2={SVG_PADDING_TOP - 10}
                stroke={fill}
                strokeWidth={1.2}
              />
            )}

            {/* Glow for current note */}
            {isCurrent && (
              <ellipse
                cx={x}
                cy={y}
                rx={9}
                ry={7}
                fill="#F59E0B"
                opacity={0.2}
              />
            )}

            {/* Note head */}
            <ellipse cx={x} cy={y} rx={5} ry={3.5} fill={fill} />

            {/* Stem */}
            <line
              x1={stemX}
              y1={stemY1}
              x2={stemX}
              y2={stemY2}
              stroke={fill}
              strokeWidth={1.2}
            />

            {/* Note label */}
            <text
              x={x}
              y={SVG_PADDING_TOP + 65}
              textAnchor="middle"
              fontSize={7}
              fill={isCurrent ? "#F59E0B" : "rgba(255,255,255,0.3)"}
              fontFamily="monospace"
            >
              {noteLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main mini-player panel ─────────────────────────────────────────────────────

const SCALES: OcarinaScale[] = ["bass-low", "bass", "alto", "soprano"];
const SCALE_SHORT: Record<OcarinaScale, string> = {
  "bass-low": "Bass Low",
  bass: "Bass",
  alto: "Alto",
  soprano: "Soprano",
};

export default function SheetMusicMiniPlayer() {
  const [selectedScale, setSelectedScale] = useState<OcarinaScale>("alto");
  const [selectedSongIdx, setSelectedSongIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [activeSongNoteIdx, setActiveSongNoteIdx] = useState<number | null>(
    null,
  );
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedSong =
    selectedSongIdx !== null ? PRESET_SONGS[selectedSongIdx] : null;
  const currentNotes = selectedSong?.notes ?? [];

  const currentDegree =
    activeSongNoteIdx !== null && currentNotes[activeSongNoteIdx]
      ? currentNotes[activeSongNoteIdx].degree
      : null;

  const holeDiagram =
    currentDegree !== null ? HOLE_DIAGRAMS[currentDegree] : null;
  const scaleNotes = SCALE_NOTES[selectedScale];
  const currentNoteLabel =
    currentDegree !== null ? (scaleNotes[currentDegree]?.label ?? null) : null;

  // Scroll staff to centre on active note
  useEffect(() => {
    if (scrollRef.current && activeSongNoteIdx !== null) {
      const containerW = scrollRef.current.clientWidth;
      const noteX = 60 + activeSongNoteIdx * NOTE_COL_W + NOTE_COL_W / 2;
      scrollRef.current.scrollLeft = Math.max(0, noteX - containerW / 2);
    }
  }, [activeSongNoteIdx]);

  const handlePlay = () => {
    if (!selectedSong || isPlaying) return;
    setIsPlaying(true);
    const handle = playMelody(
      selectedScale,
      selectedSong.notes,
      (label, idx) => {
        setActiveNote(label);
        setActiveSongNoteIdx(idx);
      },
      () => {
        setIsPlaying(false);
        setActiveNote(null);
        setActiveSongNoteIdx(null);
        cancelRef.current = null;
      },
    );
    cancelRef.current = handle.cancel;
  };

  const handleStop = () => {
    cancelRef.current?.();
    cancelRef.current = null;
    setIsPlaying(false);
    setActiveNote(null);
    setActiveSongNoteIdx(null);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: "rgba(5, 5, 15, 0.97)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
      data-ocid="miniplayer.panel"
    >
      <div
        className="flex items-stretch"
        style={{ minHeight: "128px", maxHeight: "148px" }}
      >
        {/* Left: current note + fingering */}
        <div
          className="flex flex-col items-center justify-center gap-1 px-3 flex-shrink-0"
          style={{
            width: "88px",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="text-xl font-bold tracking-tight text-center"
            style={{ color: activeNote ? "#F59E0B" : "rgba(255,255,255,0.2)" }}
          >
            {currentNoteLabel ?? "—"}
          </div>
          <div className="text-[8px] text-white/25 uppercase tracking-widest">
            Fingering
          </div>
          <FourHoleDiagram
            holes={holeDiagram ? holeDiagram.top : [false, false, false, false]}
            holeActive="bg-amber-400"
            holeOpen={holeDiagram ? "border-white/30" : "border-white/12"}
            size="sm"
          />
          <div
            className="text-[7px] text-center mt-0.5"
            style={{
              color: "rgba(255,255,255,0.2)",
              maxWidth: "76px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedSong?.name ?? "Select song"}
          </div>
        </div>

        {/* Centre: staff */}
        <div
          className="flex-1 flex flex-col justify-center overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div
            className="text-[8px] uppercase tracking-widest px-2 pt-1.5 pb-0.5"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Sheet Music
          </div>
          <div
            ref={scrollRef}
            className="overflow-x-auto"
            style={{
              scrollBehavior: "smooth",
              // biome-ignore lint/suspicious/noExplicitAny: vendor prefix
              scrollbarWidth: "none" as any,
              height: "96px",
            }}
          >
            {currentNotes.length > 0 ? (
              <StaffSVG
                notes={currentNotes}
                activeIdx={activeSongNoteIdx}
                scale={selectedScale}
              />
            ) : (
              <div className="flex items-center justify-center h-full px-4">
                <span className="text-white/15 text-xs text-center">
                  Select a song to see sheet music
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: controls */}
        <div
          className="flex flex-col justify-center gap-1.5 px-3 py-2 flex-shrink-0"
          style={{
            width: "260px",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Scale pills */}
          <div className="flex flex-wrap gap-1">
            {SCALES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (isPlaying) handleStop();
                  setSelectedScale(s);
                }}
                data-ocid="miniplayer.toggle"
                className="text-[9px] px-1.5 py-0.5 rounded-full border transition-all"
                style={{
                  borderColor:
                    selectedScale === s ? "#F59E0B" : "rgba(255,255,255,0.15)",
                  background:
                    selectedScale === s
                      ? "rgba(245,158,11,0.18)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    selectedScale === s ? "#F59E0B" : "rgba(255,255,255,0.4)",
                }}
              >
                {SCALE_SHORT[s]}
              </button>
            ))}
          </div>

          {/* Song pills */}
          <div className="flex flex-wrap gap-1">
            {PRESET_SONGS.map((song, i) => (
              <button
                key={song.name}
                type="button"
                onClick={() => {
                  if (isPlaying) handleStop();
                  setSelectedSongIdx(i === selectedSongIdx ? null : i);
                  setActiveSongNoteIdx(null);
                  setActiveNote(null);
                }}
                data-ocid="miniplayer.button"
                className="text-[9px] px-1.5 py-0.5 rounded-full border transition-all"
                style={{
                  borderColor:
                    selectedSongIdx === i
                      ? "#60A5FA"
                      : "rgba(255,255,255,0.12)",
                  background:
                    selectedSongIdx === i
                      ? "rgba(96,165,250,0.18)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    selectedSongIdx === i
                      ? "#93C5FD"
                      : "rgba(255,255,255,0.35)",
                  maxWidth: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {song.name}
              </button>
            ))}
          </div>

          {/* Playback buttons */}
          <div className="flex items-center gap-2 mt-0.5">
            <button
              type="button"
              onClick={handlePlay}
              disabled={!selectedSong || isPlaying}
              data-ocid="miniplayer.primary_button"
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "rgba(245,158,11,0.85)", color: "#000" }}
            >
              ▶ Play
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={!isPlaying}
              data-ocid="miniplayer.secondary_button"
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              ■ Stop
            </button>
            {isPlaying && (
              <span className="text-[9px] text-amber-400 animate-pulse">
                Playing…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
