import { Button } from "@/components/ui/button";
import { FileImage, Loader2, Play, ScanLine, Square, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  HOLE_DIAGRAMS,
  type OcarinaScale,
  SCALE_NOTES,
  playNote,
} from "../utils/ocarinaSynth";

interface SheetMusicScannerProps {
  scale: OcarinaScale;
}

function MiniHoleDiagram({
  degree,
  active = false,
}: {
  degree: number;
  active?: boolean;
}) {
  const diagram = HOLE_DIAGRAMS[Math.min(degree, HOLE_DIAGRAMS.length - 1)];
  return (
    <div className="flex flex-row gap-1 items-center">
      {diagram.top.map((covered, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-hole positions
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            covered
              ? active
                ? "bg-amber-400 border-transparent"
                : "bg-amber-600/70 border-transparent"
              : "bg-transparent border-amber-600/50"
          }`}
        />
      ))}
    </div>
  );
}

export default function SheetMusicScanner({ scale }: SheetMusicScannerProps) {
  const { actor } = useActor();
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a JPG or PNG image of sheet music.");
        return;
      }
      if (!actor) {
        setError("Not connected to backend.");
        return;
      }
      setError(null);
      setDetectedNotes([]);
      setIsScanning(true);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        const dataUrl = blob.getDirectURL();

        const result = await actor.scanSheetMusic(dataUrl);
        setDetectedNotes(result.map(Number));
        if (result.length === 0) {
          setError(
            "No notes detected — try a clearer image with printed sheet music.",
          );
        }
      } catch (err) {
        console.error(err);
        setError(
          "Could not detect notes — try a clearer image with printed sheet music.",
        );
      } finally {
        setIsScanning(false);
      }
    },
    [actor],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handlePlaySequence = () => {
    if (isPlaying || detectedNotes.length === 0) return;
    setIsPlaying(true);
    setActiveIdx(0);
    const scaleNotes = SCALE_NOTES[scale];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const BPM = 120;
    const msPerBeat = (60 / BPM) * 1000;
    let cursor = 0;
    detectedNotes.forEach((degree, idx) => {
      const noteIdx = Math.min(degree, scaleNotes.length - 1);
      const freq = scaleNotes[noteIdx].frequency;
      timers.push(
        setTimeout(() => {
          setActiveIdx(idx);
          playNote(freq, 0.45);
        }, cursor),
      );
      cursor += msPerBeat;
    });
    const doneTimer = setTimeout(() => {
      setIsPlaying(false);
      setActiveIdx(null);
    }, cursor);
    timers.push(doneTimer);
    cancelRef.current = () => {
      timers.forEach(clearTimeout);
      setIsPlaying(false);
      setActiveIdx(null);
    };
  };

  const handleStop = () => {
    cancelRef.current?.();
  };

  const handleClear = () => {
    setDetectedNotes([]);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const scaleNotes = SCALE_NOTES[scale];

  return (
    <div className="rounded-2xl border border-amber-800/30 bg-black/20 backdrop-blur-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <ScanLine className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-100 text-lg">
            Scan Sheet Music
          </h3>
          <p className="text-amber-300/60 text-xs">
            Upload a photo of sheet music — we'll detect the notes
          </p>
        </div>
      </div>

      {/* Upload zone — uses a button + hidden file input for accessibility */}
      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all ${
            isDragging
              ? "border-amber-400 bg-amber-400/10"
              : "border-amber-800/40 hover:border-amber-600/60 hover:bg-amber-900/10"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          data-ocid="scanner.dropzone"
        >
          <FileImage className="h-12 w-12 text-amber-400/50 pointer-events-none" />
          <p className="text-amber-200/70 text-sm text-center pointer-events-none">
            Drop a sheet music image here
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-amber-400/70 text-xs underline hover:text-amber-300 transition-colors"
            data-ocid="scanner.upload_button"
          >
            or click to browse
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-amber-800/30">
          <img
            src={previewUrl}
            alt="Sheet music preview"
            className="w-full max-h-48 object-contain bg-black/30"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Clear image"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      )}

      {isScanning && (
        <div
          className="flex items-center gap-2 mt-4 text-amber-300 text-sm"
          data-ocid="scanner.loading_state"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing sheet music…
        </div>
      )}

      {error && !isScanning && (
        <div
          className="mt-4 text-rose-400 text-sm bg-rose-900/20 rounded-lg px-4 py-3 border border-rose-800/30"
          data-ocid="scanner.error_state"
        >
          {error}
        </div>
      )}

      {detectedNotes.length > 0 && !isScanning && (
        <div className="mt-5" data-ocid="scanner.success_state">
          <div className="flex items-center justify-between mb-3">
            <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest">
              {detectedNotes.length} note{detectedNotes.length !== 1 ? "s" : ""}{" "}
              detected
            </p>
            <div className="flex gap-2">
              {isPlaying ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStop}
                  className="h-7 text-xs gap-1 border-amber-700/40 text-amber-300 hover:bg-amber-900/30"
                  data-ocid="scanner.button"
                >
                  <Square className="h-3 w-3" /> Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handlePlaySequence}
                  className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-500 text-black"
                  data-ocid="scanner.primary_button"
                >
                  <Play className="h-3 w-3" /> Play Detected
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {detectedNotes.map((degree, idx) => {
              const noteIdx = Math.min(degree, scaleNotes.length - 1);
              const noteLabel = scaleNotes[noteIdx]?.label ?? `N${degree}`;
              const isActive = idx === activeIdx;
              return (
                <div
                  key={`detected-${idx}-${degree}`}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all ${
                    isActive
                      ? "border-amber-400 bg-amber-400/20 scale-105"
                      : "border-amber-800/30 bg-black/20"
                  }`}
                >
                  <MiniHoleDiagram degree={degree} active={isActive} />
                  <span className="font-mono text-[10px] text-amber-300/70">
                    {noteLabel.replace(/\d/, "")}
                    <span className="text-[8px] opacity-50">
                      {noteLabel.match(/\d/)?.[0]}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
