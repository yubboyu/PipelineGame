import type { Difficulty } from "../game/types";

export type HighScores = Record<Difficulty, number[]>;

const STORAGE_KEY = "pipe-connect-high-scores";

function createEmptyScores(): HighScores {
  return {
    easy: [],
    normal: [],
    hard: [],
    veryHard: [],
    expert: [],
  };
}

export function loadHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyScores();
    }

    const parsed = JSON.parse(raw) as Partial<HighScores>;

    return {
      easy: Array.isArray(parsed.easy) ? parsed.easy : [],

      normal: Array.isArray(parsed.normal) ? parsed.normal : [],

      hard: Array.isArray(parsed.hard) ? parsed.hard : [],

      veryHard: Array.isArray(parsed.veryHard) ? parsed.veryHard : [],

      expert: Array.isArray(parsed.expert) ? parsed.expert : [],
    };
  } catch {
    return createEmptyScores();
  }
}

export function saveHighScore(
  difficulty: Difficulty,
  timeMs: number
): HighScores {
  const scores = loadHighScores();

  const updatedScores = [...scores[difficulty], timeMs]
    .sort((a, b) => a - b)
    .slice(0, 10);

  const nextScores: HighScores = {
    ...scores,

    [difficulty]: updatedScores,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextScores));

  return nextScores;
}

export function clearHighScores(): void {
  localStorage.removeItem(STORAGE_KEY);
}
