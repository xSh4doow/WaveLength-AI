import { Mic, Music2 } from "lucide-react";
import { type Song } from "@/services/api";

interface SongTagsProps {
  song: Song;
  maxTags?: number;
}

export function SongTags({ song, maxTags = 3 }: SongTagsProps) {
  const tags: string[] = [];

  // Add vocal type tag (priority)
  if (song.has_vocals && song.has_lyrics) {
    tags.push("Cantado");
  } else {
    tags.push("Instrumental");
  }

  // Add genre tag
  if (song.genre) {
    tags.push(song.genre);
  }

  // Add user tags (split by comma)
  if (song.tags) {
    const userTags = song.tags.split(",").map((t) => t.trim());
    tags.push(...userTags);
  }

  // Limit tags if needed
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const hasMore = tags.length > displayTags.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTags.map((tag, index) => {
        const isVocalTag = tag === "Cantado" || tag === "Instrumental";

        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isVocalTag
                ? tag === "Cantado"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground border border-border"
                : "glass-effect"
            }`}
          >
            {isVocalTag && (
              tag === "Cantado" ? (
                <Mic className="w-3 h-3" />
              ) : (
                <Music2 className="w-3 h-3" />
              )
            )}
            {tag}
          </span>
        );
      })}
      {hasMore && (
        <span className="text-xs text-muted-foreground">
          +{tags.length - displayTags.length}
        </span>
      )}
    </div>
  );
}
