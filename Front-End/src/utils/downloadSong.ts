import { getAudioUrl } from "@/services/api";

/**
 * Download a song file directly (no redirect to CDN)
 * @param audioPath - The audio path from the song
 * @param fileName - Optional custom file name
 */
export async function downloadSong(audioPath: string, fileName?: string): Promise<void> {
  try {
    const audioUrl = getAudioUrl(audioPath);

    // Fetch the audio file as a blob
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create a temporary URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement("a");
    link.href = blobUrl;

    // Determine file extension from blob type or URL
    let extension = "mp3"; // default
    if (blob.type.includes("wav")) {
      extension = "wav";
    } else if (blob.type.includes("mp3") || blob.type.includes("mpeg")) {
      extension = "mp3";
    } else if (audioPath.endsWith(".wav")) {
      extension = "wav";
    } else if (audioPath.endsWith(".mp3")) {
      extension = "mp3";
    }

    link.download = fileName ? `${fileName}.${extension}` : `wavelength-song.${extension}`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}
