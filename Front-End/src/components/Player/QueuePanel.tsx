import { X, GripVertical, Music2 } from "lucide-react";
import { useQueue } from "@/contexts/QueueContext";
import { getAudioUrl } from "@/services/api";
import { SongTags } from "@/components/ui/song-tags";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { queue, currentIndex, removeFromQueue, playAt, clearQueue } = useQueue();

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = queue.reduce((acc, song) => acc + song.duration, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="w-full md:w-[500px] max-h-[80vh] bg-background border border-border rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Fila de Reprodução</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {queue.length} {queue.length === 1 ? "música" : "músicas"} • {formatDuration(totalDuration)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma música na fila</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione músicas para começar a ouvir
              </p>
            </div>
          ) : (
            queue.map((song, index) => {
              const isPlaying = index === currentIndex;
              const imageUrl = song.image_path ? getAudioUrl(song.image_path) : "";

              return (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all group ${
                    isPlaying
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  {/* Drag Handle */}
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Song Image */}
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => playAt(index)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={song.song_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
                    )}
                  </div>

                  {/* Song Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => playAt(index)}
                  >
                    <p className={`font-semibold truncate ${isPlaying ? "text-primary" : ""}`}>
                      {song.song_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <SongTags song={song} maxTags={2} />
                    </div>
                  </div>

                  {/* Duration & Remove */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(index);
                      }}
                      className="w-8 h-8 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {queue.length > 0 && (
          <div className="p-4 border-t border-border">
            <button
              onClick={clearQueue}
              className="w-full py-2 px-4 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold transition-colors"
            >
              Limpar Fila
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
