import { DIFFICULTIES, DIRECTIONS, OPPOSITE, ROTATIONS } from "./types";

import type {
  Difficulty,
  Direction,
  Rotation,
  TileData,
  TileType,
} from "./types";

type ConnectionMap = Set<Direction>[];

type CycleCategory = "small" | "medium" | "large";

type CycleLimits = {
  min: number;
  max: number;
};

type GenerationProfile = {
  minLoops: number;
  maxLoops: number;

  smallCycles: CycleLimits;
  mediumCycles: CycleLimits;
  largeCycles: CycleLimits;

  minCrosses: number;
  maxCrosses: number;

  minTees: number;
  maxTees: number;

  minComplexity: number;
  maxComplexity: number;

  minAverageDistance: number;
  minMaxDistance: number;
};

const GENERATION_PROFILES: Record<Difficulty, GenerationProfile> = {
  easy: {
    minLoops: 0,
    maxLoops: 0,

    smallCycles: {
      min: 0,
      max: 0,
    },

    mediumCycles: {
      min: 0,
      max: 0,
    },

    largeCycles: {
      min: 0,
      max: 0,
    },

    minCrosses: 0,
    maxCrosses: 0,

    minTees: 2,
    maxTees: 10,

    minComplexity: 10,
    maxComplexity: 50,

    minAverageDistance: 2.5,
    minMaxDistance: 5,
  },

  normal: {
    minLoops: 0,
    maxLoops: 0,

    smallCycles: {
      min: 0,
      max: 0,
    },

    mediumCycles: {
      min: 0,
      max: 0,
    },

    largeCycles: {
      min: 0,
      max: 0,
    },

    minCrosses: 0,
    maxCrosses: 2,

    minTees: 4,
    maxTees: 16,

    minComplexity: 20,
    maxComplexity: 60,

    minAverageDistance: 3.5,
    minMaxDistance: 8,
  },

  hard: {
    minLoops: 2,
    maxLoops: 4,

    smallCycles: {
      min: 0,
      max: 2,
    },

    mediumCycles: {
      min: 1,
      max: 3,
    },

    largeCycles: {
      min: 0,
      max: 1,
    },

    minCrosses: 0,
    maxCrosses: 4,

    minTees: 8,
    maxTees: 22,

    minComplexity: 25,
    maxComplexity: 70,

    minAverageDistance: 4.5,
    minMaxDistance: 11,
  },

  veryHard: {
    minLoops: 6,
    maxLoops: 10,

    smallCycles: {
      min: 0,
      max: 3,
    },

    mediumCycles: {
      min: 2,
      max: 6,
    },

    largeCycles: {
      min: 1,
      max: 4,
    },

    minCrosses: 1,
    maxCrosses: 7,

    minTees: 15,
    maxTees: 34,

    minComplexity: 30,
    maxComplexity: 78,

    minAverageDistance: 6,
    minMaxDistance: 15,
  },

  expert: {
    minLoops: 12,
    maxLoops: 18,

    smallCycles: {
      min: 0,
      max: 4,
    },

    mediumCycles: {
      min: 4,
      max: 10,
    },

    largeCycles: {
      min: 3,
      max: 9,
    },

    minCrosses: 2,
    maxCrosses: 10,

    minTees: 22,
    maxTees: 48,

    minComplexity: 35,
    maxComplexity: 85,

    minAverageDistance: 7.5,
    minMaxDistance: 19,
  },
};

export type PuzzleGenerationResult = {
  tiles: TileData[];

  rows: number;
  cols: number;

  sourceId: number;

  loopCount: number;

  smallCycleCount: number;
  mediumCycleCount: number;
  largeCycleCount: number;

  cycleLengths: number[];

  crossCount: number;
  teeCount: number;

  complexityScore: number;

  averageDistance: number;
  maxDistance: number;
  totalDistance: number;
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getRowCol(id: number, cols: number) {
  return {
    row: Math.floor(id / cols),

    col: id % cols,
  };
}

function getId(row: number, col: number, cols: number): number {
  return row * cols + col;
}

function getNeighbor(
  id: number,
  direction: Direction,
  rows: number,
  cols: number
): number | null {
  const { row, col } = getRowCol(id, cols);

  const offsets: Record<Direction, [number, number]> = {
    top: [-1, 0],
    right: [0, 1],
    bottom: [1, 0],
    left: [0, -1],
  };

  const [dr, dc] = offsets[direction];

  const nextRow = row + dr;

  const nextCol = col + dc;

  if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
    return null;
  }

  return getId(nextRow, nextCol, cols);
}

function createEmptyConnections(count: number): ConnectionMap {
  return Array.from(
    {
      length: count,
    },
    () => new Set<Direction>()
  );
}

function getInternalMaxDegree(
  id: number,
  sourceId: number,
  allowCross: boolean
): number {
  if (id === sourceId) {
    return allowCross ? 3 : 2;
  }

  return allowCross ? 4 : 3;
}

function wouldCreateCross(
  id: number,
  connections: ConnectionMap,
  sourceId: number
): boolean {
  const finalDegreeBeforeAdd = connections[id].size + (id === sourceId ? 1 : 0);

  return finalDegreeBeforeAdd === 3;
}

function findGraphDistance(
  connections: ConnectionMap,
  start: number,
  goal: number,
  rows: number,
  cols: number
): number | null {
  if (start === goal) {
    return 0;
  }

  const visited = new Set<number>([start]);

  const queue: {
    id: number;
    distance: number;
  }[] = [
    {
      id: start,
      distance: 0,
    },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const direction of connections[current.id]) {
      const neighborId = getNeighbor(current.id, direction, rows, cols);

      if (neighborId === null) {
        continue;
      }

      if (visited.has(neighborId)) {
        continue;
      }

      const nextDistance = current.distance + 1;

      if (neighborId === goal) {
        return nextDistance;
      }

      visited.add(neighborId);

      queue.push({
        id: neighborId,

        distance: nextDistance,
      });
    }
  }

  return null;
}

function classifyCycle(cycleLength: number): CycleCategory {
  if (cycleLength <= 5) {
    return "small";
  }

  if (cycleLength <= 9) {
    return "medium";
  }

  return "large";
}

function createSpanningTree(
  rows: number,
  cols: number,
  allowCross: boolean,
  sourceId: number,
  maxCrosses: number
): ConnectionMap | null {
  const cellCount = rows * cols;

  const connections = createEmptyConnections(cellCount);

  const visited = new Set<number>();

  visited.add(sourceId);

  let crossCount = 0;

  while (visited.size < cellCount) {
    const candidates: {
      from: number;
      to: number;
      direction: Direction;
      createsCross: boolean;
    }[] = [];

    for (const from of visited) {
      const maxDegree = getInternalMaxDegree(from, sourceId, allowCross);

      if (connections[from].size >= maxDegree) {
        continue;
      }

      for (const direction of DIRECTIONS) {
        const to = getNeighbor(from, direction, rows, cols);

        if (to === null || visited.has(to)) {
          continue;
        }

        const createsCross =
          allowCross && wouldCreateCross(from, connections, sourceId);

        if (createsCross && crossCount >= maxCrosses) {
          continue;
        }

        candidates.push({
          from,
          to,
          direction,
          createsCross,
        });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    const choice = randomItem(candidates);

    connections[choice.from].add(choice.direction);

    connections[choice.to].add(OPPOSITE[choice.direction]);

    if (choice.createsCross) {
      crossCount++;
    }

    visited.add(choice.to);
  }

  return connections;
}

function countCrosses(connections: ConnectionMap, sourceId: number): number {
  let count = 0;

  connections.forEach((set, id) => {
    const degree = set.size + (id === sourceId ? 1 : 0);

    if (degree === 4) {
      count++;
    }
  });

  return count;
}

type LoopCandidate = {
  from: number;
  to: number;
  direction: Direction;

  cycleLength: number;
  category: CycleCategory;
};

type LoopResult = {
  cycleLengths: number[];

  small: number;
  medium: number;
  large: number;
};

function getCycleCount(result: LoopResult, category: CycleCategory): number {
  return result[category];
}

function getCycleLimits(
  profile: GenerationProfile,
  category: CycleCategory
): CycleLimits {
  switch (category) {
    case "small":
      return profile.smallCycles;

    case "medium":
      return profile.mediumCycles;

    case "large":
      return profile.largeCycles;
  }
}

function categoryPriority(
  result: LoopResult,
  profile: GenerationProfile,
  category: CycleCategory
): number {
  const limits = getCycleLimits(profile, category);

  const count = getCycleCount(result, category);

  if (count < limits.min) {
    return 1000;
  }

  switch (category) {
    case "large":
      return 30;

    case "medium":
      return 20;

    case "small":
      return 5;
  }
}

function addLoops(
  connections: ConnectionMap,
  rows: number,
  cols: number,
  sourceId: number,
  allowCross: boolean,
  targetLoops: number,
  profile: GenerationProfile
): LoopResult {
  const result: LoopResult = {
    cycleLengths: [],

    small: 0,
    medium: 0,
    large: 0,
  };

  while (result.cycleLengths.length < targetLoops) {
    const candidates: LoopCandidate[] = [];

    for (let from = 0; from < connections.length; from++) {
      for (const direction of ["right", "bottom"] as Direction[]) {
        const to = getNeighbor(from, direction, rows, cols);

        if (to === null) {
          continue;
        }

        if (connections[from].has(direction)) {
          continue;
        }

        const fromMax = getInternalMaxDegree(from, sourceId, allowCross);

        const toMax = getInternalMaxDegree(to, sourceId, allowCross);

        if (
          connections[from].size >= fromMax ||
          connections[to].size >= toMax
        ) {
          continue;
        }

        const currentCrosses = countCrosses(connections, sourceId);

        const fromCreatesCross =
          allowCross && wouldCreateCross(from, connections, sourceId);

        const toCreatesCross =
          allowCross && wouldCreateCross(to, connections, sourceId);

        const crossesAdded = Number(fromCreatesCross) + Number(toCreatesCross);

        if (currentCrosses + crossesAdded > profile.maxCrosses) {
          continue;
        }

        const existingDistance = findGraphDistance(
          connections,
          from,
          to,
          rows,
          cols
        );

        if (existingDistance === null) {
          continue;
        }

        const cycleLength = existingDistance + 1;

        if (cycleLength < 4) {
          continue;
        }

        const category = classifyCycle(cycleLength);

        const limits = getCycleLimits(profile, category);

        if (getCycleCount(result, category) >= limits.max) {
          continue;
        }

        candidates.push({
          from,
          to,
          direction,

          cycleLength,
          category,
        });
      }
    }

    if (candidates.length === 0) {
      break;
    }

    const ranked = shuffle(candidates).sort((a, b) => {
      const priorityA = categoryPriority(result, profile, a.category);

      const priorityB = categoryPriority(result, profile, b.category);

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      return b.cycleLength - a.cycleLength;
    });

    const topCount = Math.min(8, ranked.length);

    const choice = randomItem(ranked.slice(0, topCount));

    connections[choice.from].add(choice.direction);

    connections[choice.to].add(OPPOSITE[choice.direction]);

    result.cycleLengths.push(choice.cycleLength);

    result[choice.category]++;
  }

  return result;
}

function connectionsToTile(connectionSet: Set<Direction>): {
  type: TileType;
  rotation: Rotation;
} {
  const has = (direction: Direction) => connectionSet.has(direction);

  const count = connectionSet.size;

  if (count === 1) {
    if (has("top")) {
      return {
        type: "end",
        rotation: 0,
      };
    }

    if (has("right")) {
      return {
        type: "end",
        rotation: 90,
      };
    }

    if (has("bottom")) {
      return {
        type: "end",
        rotation: 180,
      };
    }

    return {
      type: "end",
      rotation: 270,
    };
  }

  if (count === 2) {
    if (has("top") && has("bottom")) {
      return {
        type: "straight",
        rotation: 0,
      };
    }

    if (has("left") && has("right")) {
      return {
        type: "straight",
        rotation: 90,
      };
    }

    if (has("top") && has("right")) {
      return {
        type: "corner",
        rotation: 0,
      };
    }

    if (has("right") && has("bottom")) {
      return {
        type: "corner",
        rotation: 90,
      };
    }

    if (has("bottom") && has("left")) {
      return {
        type: "corner",
        rotation: 180,
      };
    }

    return {
      type: "corner",
      rotation: 270,
    };
  }

  if (count === 3) {
    if (!has("bottom")) {
      return {
        type: "tee",
        rotation: 0,
      };
    }

    if (!has("left")) {
      return {
        type: "tee",
        rotation: 90,
      };
    }

    if (!has("top")) {
      return {
        type: "tee",
        rotation: 180,
      };
    }

    return {
      type: "tee",
      rotation: 270,
    };
  }

  if (count === 4) {
    return {
      type: "cross",
      rotation: 0,
    };
  }

  throw new Error(`Unsupported connection count: ${count}`);
}

function scrambleRotation(
  type: TileType,
  solutionRotation: Rotation
): Rotation {
  if (type === "cross") {
    return 0;
  }

  const offset = randomItem(ROTATIONS);

  return ((solutionRotation + offset) % 360) as Rotation;
}

type PathMetrics = {
  averageDistance: number;
  maxDistance: number;
  totalDistance: number;
};

function calculatePathMetrics(
  connections: ConnectionMap,
  sourceId: number,
  rows: number,
  cols: number
): PathMetrics {
  const distances = new Map<number, number>();

  distances.set(sourceId, 0);

  const queue: number[] = [sourceId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    const currentDistance = distances.get(current) ?? 0;

    for (const direction of connections[current]) {
      if (current === sourceId && direction === "top") {
        continue;
      }

      const neighbor = getNeighbor(current, direction, rows, cols);

      if (neighbor === null || distances.has(neighbor)) {
        continue;
      }

      distances.set(neighbor, currentDistance + 1);

      queue.push(neighbor);
    }
  }

  const values = Array.from(distances.values());

  const totalDistance = values.reduce((sum, value) => sum + value, 0);

  const maxDistance = Math.max(...values);

  const averageDistance = totalDistance / values.length;

  return {
    averageDistance,
    maxDistance,
    totalDistance,
  };
}

function calculateComplexity(
  tiles: {
    type: TileType;
  }[],
  loopResult: LoopResult,
  pathMetrics: PathMetrics,
  rows: number,
  cols: number
): number {
  let teeCount = 0;
  let cornerCount = 0;
  let straightCount = 0;
  let crossCount = 0;
  let endCount = 0;

  for (const tile of tiles) {
    switch (tile.type) {
      case "tee":
        teeCount++;
        break;

      case "corner":
        cornerCount++;
        break;

      case "straight":
        straightCount++;
        break;

      case "cross":
        crossCount++;
        break;

      case "end":
        endCount++;
        break;
    }
  }

  const tileCount = tiles.length;

  const teeRatio = teeCount / tileCount;

  const crossRatio = crossCount / tileCount;

  const branchScore = teeRatio * 60 + crossRatio * 15;

  const weightedCycles =
    loopResult.small * 1 + loopResult.medium * 2 + loopResult.large * 3;

  const cycleScore = (weightedCycles / tileCount) * 50;

  const geometricDistance = Math.max(1, rows + cols - 2);

  const averageDistanceRatio = Math.min(
    1,
    pathMetrics.averageDistance / geometricDistance
  );

  const maxDistanceRatio = Math.min(
    1,
    pathMetrics.maxDistance / geometricDistance
  );

  const pathScore = averageDistanceRatio * 20 + maxDistanceRatio * 20;

  const fourWayRotatable = endCount + cornerCount + teeCount;

  const rotationScore =
    ((fourWayRotatable * 1 + straightCount * 0.5) / tileCount) * 10;

  const score = branchScore + cycleScore + pathScore + rotationScore;

  return Math.max(0, Math.min(100, score));
}

function buildCandidatePuzzle(
  difficulty: Difficulty
): PuzzleGenerationResult | null {
  const config = DIFFICULTIES[difficulty];

  const profile = GENERATION_PROFILES[difficulty];

  const rows = config.rows;

  const cols = config.cols;

  const sourceId = Math.floor(cols / 2);

  const connections = createSpanningTree(
    rows,
    cols,
    config.allowCross,
    sourceId,
    profile.maxCrosses
  );

  if (!connections) {
    return null;
  }

  const targetLoops = randomInteger(profile.minLoops, profile.maxLoops);

  const loopResult = addLoops(
    connections,
    rows,
    cols,
    sourceId,
    config.allowCross,
    targetLoops,
    profile
  );

  const loopCount = loopResult.cycleLengths.length;

  if (loopCount < profile.minLoops || loopCount > profile.maxLoops) {
    return null;
  }

  if (
    loopResult.small < profile.smallCycles.min ||
    loopResult.small > profile.smallCycles.max
  ) {
    return null;
  }

  if (
    loopResult.medium < profile.mediumCycles.min ||
    loopResult.medium > profile.mediumCycles.max
  ) {
    return null;
  }

  if (
    loopResult.large < profile.largeCycles.min ||
    loopResult.large > profile.largeCycles.max
  ) {
    return null;
  }

  connections[sourceId].add("top");

  const solvedTiles = connections.map((connectionSet) =>
    connectionsToTile(connectionSet)
  );

  const crossCount = solvedTiles.filter((tile) => tile.type === "cross").length;

  const teeCount = solvedTiles.filter((tile) => tile.type === "tee").length;

  if (crossCount < profile.minCrosses || crossCount > profile.maxCrosses) {
    return null;
  }

  if (teeCount < profile.minTees || teeCount > profile.maxTees) {
    return null;
  }

  const pathMetrics = calculatePathMetrics(connections, sourceId, rows, cols);

  if (pathMetrics.averageDistance < profile.minAverageDistance) {
    return null;
  }

  if (pathMetrics.maxDistance < profile.minMaxDistance) {
    return null;
  }

  const complexityScore = calculateComplexity(
    solvedTiles,
    loopResult,
    pathMetrics,
    rows,
    cols
  );

  if (
    complexityScore < profile.minComplexity ||
    complexityScore > profile.maxComplexity
  ) {
    return null;
  }

  const tiles: TileData[] = solvedTiles.map((solution, id) => ({
    id,

    type: solution.type,

    solutionRotation: solution.rotation,

    rotation: scrambleRotation(solution.type, solution.rotation),
  }));

  return {
    tiles,

    rows,
    cols,

    sourceId,

    loopCount,

    smallCycleCount: loopResult.small,

    mediumCycleCount: loopResult.medium,

    largeCycleCount: loopResult.large,

    cycleLengths: loopResult.cycleLengths,

    crossCount,
    teeCount,

    complexityScore,

    averageDistance: pathMetrics.averageDistance,

    maxDistance: pathMetrics.maxDistance,

    totalDistance: pathMetrics.totalDistance,
  };
}

export function createPuzzle(difficulty: Difficulty): PuzzleGenerationResult {
  for (let attempt = 0; attempt < 8000; attempt++) {
    const result = buildCandidatePuzzle(difficulty);

    if (result) {
      return result;
    }
  }

  throw new Error(`Puzzle generation failed: ${difficulty}`);
}

export function cloneTiles(tiles: TileData[]): TileData[] {
  return tiles.map((tile) => ({
    ...tile,
  }));
}
