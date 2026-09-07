export type Rotation = 0 | 90 | 180 | 270;

export type Direction = "top" | "right" | "bottom" | "left";

export type TileType = "straight" | "corner" | "tee" | "cross" | "end";

export type Difficulty = "easy" | "normal" | "hard" | "veryHard" | "expert";

export type TileData = {
  id: number;
  type: TileType;
  rotation: Rotation;
  solutionRotation: Rotation;
};

export type DifficultyConfig = {
  label: string;

  rows: number;
  cols: number;

  allowCross: boolean;

  /*
    追加する2×2循環ルートの目標数。
    生成条件によって実際には
    少なくなる場合がある。
  */
  loopTarget: number;
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    rows: 5,
    cols: 5,
    allowCross: false,
    loopTarget: 0,
  },

  normal: {
    label: "Normal",
    rows: 7,
    cols: 7,
    allowCross: true,
    loopTarget: 0,
  },

  hard: {
    label: "Hard",
    rows: 9,
    cols: 9,
    allowCross: true,
    loopTarget: 2,
  },

  veryHard: {
    label: "Very Hard",
    rows: 11,
    cols: 11,
    allowCross: true,
    loopTarget: 6,
  },

  expert: {
    label: "Expert",
    rows: 15,
    cols: 11,
    allowCross: true,
    loopTarget: 12,
  },
};

export const DIRECTIONS: Direction[] = ["top", "right", "bottom", "left"];

export const OPPOSITE: Record<Direction, Direction> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

export const ROTATIONS: Rotation[] = [0, 90, 180, 270];
