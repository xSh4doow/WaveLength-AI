/**
 * GlobalPlayer - Componente global que renderiza o player
 * Alterna entre minimizado e maximizado baseado no estado
 */

import { usePlayer } from "@/contexts/PlayerContext";
import { PlayerMinimized } from "./PlayerMinimized";
import { PlayerOverlay } from "./PlayerOverlay";

export function GlobalPlayer() {
  const { playerState } = usePlayer();

  if (playerState === "hidden") return null;

  return (
    <>
      {playerState === "minimized" && <PlayerMinimized />}
      {playerState === "maximized" && <PlayerOverlay />}
    </>
  );
}
