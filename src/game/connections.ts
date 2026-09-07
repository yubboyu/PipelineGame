import { DIRECTIONS, OPPOSITE } from "./types";

import type { Direction, Rotation, TileData, TileType } from "./types";

const OFFSETS: Record<Direction, [number, number]> = {
  top: [-1, 0],
  right: [0, 1],
  bottom: [1, 0],
  left: [0, -1],
};

export function getTileDirections(
  type: TileType,
  rotation: Rotation
): Direction[] {
  let baseDirections: Direction[];

  switch (type) {
    case "end":
      baseDirections = ["top"];
      break;

    case "straight":
      baseDirections = ["top", "bottom"];
      break;

    case "corner":
      baseDirections = ["top", "right"];
      break;

    case "tee":
      baseDirections = ["top", "left", "right"];
      break;

    case "cross":
      baseDirections = ["top", "right", "bottom", "left"];
      break;
  }

  const steps = rotation / 90;

  return baseDirections.map((direction) => {
    const index = DIRECTIONS.indexOf(direction);

    return DIRECTIONS[(index + steps) % 4];
  });
}

function getNeighbor(
  id: number,
  direction: Direction,
  rows: number,
  cols: number
): number | null {
  const row = Math.floor(id / cols);

  const col = id % cols;

  const [dr, dc] = OFFSETS[direction];

  const nextRow = row + dr;

  const nextCol = col + dc;

  if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
    return null;
  }

  return nextRow * cols + nextCol;
}

export type FlowState = {
  connectedIds: Set<number>;

  distances: Map<number, number>;
};

/*
  水源から実際に
  到達できるマスを探索。
*/
export function getFlowState(
  tiles: TileData[],
  rows: number,
  cols: number,
  sourceId: number
): FlowState {
  const connectedIds = new Set<number>();

  const distances = new Map<number, number>();

  const sourceTile = tiles[sourceId];

  if (!sourceTile) {
    return {
      connectedIds,
      distances,
    };
  }

  const sourceDirections = getTileDirections(
    sourceTile.type,
    sourceTile.rotation
  );

  /*
    水源との上接続がなければ
    水は流入しない。
  */
  if (!sourceDirections.includes("top")) {
    return {
      connectedIds,
      distances,
    };
  }

  connectedIds.add(sourceId);

  distances.set(sourceId, 0);

  const queue: number[] = [sourceId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const currentTile = tiles[currentId];

    const currentDirections = getTileDirections(
      currentTile.type,
      currentTile.rotation
    );

    const currentDistance = distances.get(currentId) ?? 0;

    for (const direction of currentDirections) {
      /*
        水源外部へのtop接続は
        盤面内探索対象ではない。
      */
      if (currentId === sourceId && direction === "top") {
        continue;
      }

      const neighborId = getNeighbor(currentId, direction, rows, cols);

      if (neighborId === null) {
        continue;
      }

      const neighborTile = tiles[neighborId];

      const neighborDirections = getTileDirections(
        neighborTile.type,
        neighborTile.rotation
      );

      if (!neighborDirections.includes(OPPOSITE[direction])) {
        continue;
      }

      if (connectedIds.has(neighborId)) {
        continue;
      }

      connectedIds.add(neighborId);

      distances.set(neighborId, currentDistance + 1);

      queue.push(neighborId);
    }
  }

  return {
    connectedIds,
    distances,
  };
}

/*
  パイプの全出口が
  正しく接続されているか確認。

  水源マスのtopだけは
  外部水源接続として例外。
*/
export function hasNoLeaks(
  tiles: TileData[],
  rows: number,
  cols: number,
  sourceId: number
): boolean {
  for (const tile of tiles) {
    const directions = getTileDirections(tile.type, tile.rotation);

    for (const direction of directions) {
      if (tile.id === sourceId && direction === "top") {
        continue;
      }

      const neighborId = getNeighbor(tile.id, direction, rows, cols);

      /*
        盤面外へパイプが
        向いていれば漏れ。
      */
      if (neighborId === null) {
        return false;
      }

      const neighborTile = tiles[neighborId];

      const neighborDirections = getTileDirections(
        neighborTile.type,
        neighborTile.rotation
      );

      /*
        自分は右、
        隣は左、
        のように相互接続必須。
      */
      if (!neighborDirections.includes(OPPOSITE[direction])) {
        return false;
      }
    }
  }

  return true;
}

export function isPuzzleCleared(
  flowState: FlowState,
  tiles: TileData[],
  rows: number,
  cols: number,
  sourceId: number
): boolean {
  /*
    全マスに水が届く。
  */
  const allConnected = flowState.connectedIds.size === rows * cols;

  if (!allConnected) {
    return false;
  }

  /*
    さらに全出口が
    正しくつながっている。
  */
  return hasNoLeaks(tiles, rows, cols, sourceId);
}

export type TileConnectionStatus = "complete" | "broken";

/*
  1枚のタイルについて、
  そのタイルから出ている全パイプが
  隣と正しく接続しているか判定する。

  水源マスのtopだけは
  外部水源につながっているので正常扱い。
*/
export function getTileConnectionStatus(
  tiles: TileData[],
  rows: number,
  cols: number,
  sourceId: number,
  tileId: number
): TileConnectionStatus {
  const tile = tiles[tileId];

  if (!tile) {
    return "broken";
  }

  const directions = getTileDirections(tile.type, tile.rotation);

  for (const direction of directions) {
    /*
      水源タイルの上方向は
      WATERから供給されるので正常。
    */
    if (tileId === sourceId && direction === "top") {
      continue;
    }

    const neighborId = getNeighbor(tileId, direction, rows, cols);

    /*
      パイプが盤面外へ
      向いていれば未接続。
    */
    if (neighborId === null) {
      return "broken";
    }

    const neighborTile = tiles[neighborId];

    if (!neighborTile) {
      return "broken";
    }

    const neighborDirections = getTileDirections(
      neighborTile.type,
      neighborTile.rotation
    );

    /*
      自分の出口に対して
      隣側に入口がなければ未接続。
    */
    if (!neighborDirections.includes(OPPOSITE[direction])) {
      return "broken";
    }
  }

  return "complete";
}
