import type { CSSProperties } from "react";

import Tile from "./Tile";

import { WaterSource } from "./WaterSource";

import { getTileConnectionStatus } from "../game/connections";

import type { TileData } from "../game/types";

type BoardProps = {
  tiles: TileData[];

  rows: number;
  cols: number;

  sourceId: number;

  connectedIds: Set<number>;

  distances: Map<number, number>;

  isCleared: boolean;

  onRotateTile: (id: number) => void;
};

export default function Board({
  tiles,
  rows,
  cols,
  sourceId,
  connectedIds,
  distances,
  isCleared,
  onRotateTile,
}: BoardProps) {
  const sourceActive = connectedIds.has(sourceId);

  return (
    <div
      className="puzzle-area"
      style={
        {
          "--board-rows": rows,

          "--board-cols": cols,
        } as CSSProperties
      }
    >
      <WaterSource active={sourceActive} flowing={isCleared} />

      <div className="board">
        {tiles.map((tile) => {
          const distance = distances.get(tile.id) ?? 0;

          const connectionStatus = getTileConnectionStatus(
            tiles,
            rows,
            cols,
            sourceId,
            tile.id
          );

          return (
            <Tile
              key={tile.id}
              type={tile.type}
              rotation={tile.rotation}
              connected={connectedIds.has(tile.id)}
              flowing={isCleared}
              flowDelayMs={distance * 120}
              connectionStatus={connectionStatus}
              onClick={() => onRotateTile(tile.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
