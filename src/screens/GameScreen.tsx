import { useEffect, useMemo, useRef, useState } from "react";

import type { CSSProperties } from "react";

import Board from "../components/Board";
import Timer from "../components/Timer";

import { createPuzzle, cloneTiles } from "../game/generatePuzzle";

import { getFlowState, isPuzzleCleared } from "../game/connections";

import { saveHighScore } from "../storage/highScores";

import type { Difficulty, Rotation, TileData } from "../game/types";

type GameScreenProps = {
  difficulty: Difficulty;
  onBack: () => void;
};

type PuzzleState = {
  tiles: TileData[];

  rows: number;
  cols: number;

  sourceId: number;

  loopCount: number;
  crossCount: number;
  complexityScore: number;
};

const WATER_COLORS = [
  "#38bdf8",
  "#22c55e",
  "#f97316",
  "#e879f9",
  "#f43f5e",
  "#eab308",
  "#8b5cf6",
];

function randomWaterColor(): string {
  return WATER_COLORS[Math.floor(Math.random() * WATER_COLORS.length)];
}

function makePuzzle(difficulty: Difficulty): PuzzleState {
  const puzzle = createPuzzle(difficulty);

  return {
    tiles: cloneTiles(puzzle.tiles),

    rows: puzzle.rows,

    cols: puzzle.cols,

    sourceId: puzzle.sourceId,

    loopCount: puzzle.loopCount,

    crossCount: puzzle.crossCount,

    complexityScore: puzzle.complexityScore,
  };
}

export default function GameScreen({ difficulty, onBack }: GameScreenProps) {
  const [initialPuzzle, setInitialPuzzle] = useState<PuzzleState>(() =>
    makePuzzle(difficulty)
  );

  const [tiles, setTiles] = useState<TileData[]>(() =>
    cloneTiles(initialPuzzle.tiles)
  );

  const [elapsedMs, setElapsedMs] = useState(0);

  const [waterColor, setWaterColor] = useState(() => randomWaterColor());

  const startTimeRef = useRef(Date.now());

  const finalTimeRef = useRef<number | null>(null);

  const scoreSavedRef = useRef(false);

  const flowState = useMemo(
    () =>
      getFlowState(
        tiles,
        initialPuzzle.rows,
        initialPuzzle.cols,
        initialPuzzle.sourceId
      ),
    [tiles, initialPuzzle.rows, initialPuzzle.cols, initialPuzzle.sourceId]
  );

  const isCleared = isPuzzleCleared(
    flowState,
    tiles,
    initialPuzzle.rows,
    initialPuzzle.cols,
    initialPuzzle.sourceId
  );

  useEffect(() => {
    if (isCleared) {
      if (finalTimeRef.current === null) {
        finalTimeRef.current = Date.now() - startTimeRef.current;

        setElapsedMs(finalTimeRef.current);
      }

      if (finalTimeRef.current !== null && !scoreSavedRef.current) {
        saveHighScore(difficulty, finalTimeRef.current);

        scoreSavedRef.current = true;
      }

      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [isCleared, difficulty]);

  const restartTimer = () => {
    startTimeRef.current = Date.now();

    finalTimeRef.current = null;

    scoreSavedRef.current = false;

    setElapsedMs(0);
  };

  const rotateTile = (id: number) => {
    if (isCleared) {
      return;
    }

    setTiles((currentTiles) =>
      currentTiles.map((tile) => {
        if (tile.id !== id) {
          return tile;
        }

        if (tile.type === "cross") {
          return tile;
        }

        return {
          ...tile,

          rotation: ((tile.rotation + 90) % 360) as Rotation,
        };
      })
    );
  };

  const resetPuzzle = () => {
    setTiles(cloneTiles(initialPuzzle.tiles));

    /*
      RESETでは
      水色を変えない。
    */
    restartTimer();
  };

  const newPuzzle = () => {
    const puzzle = makePuzzle(difficulty);

    setInitialPuzzle(puzzle);

    setTiles(cloneTiles(puzzle.tiles));

    /*
      NEW PUZZLEでは
      新しい水色。
    */
    setWaterColor(randomWaterColor());

    restartTimer();
  };

  return (
    <main
      className="app"
      style={
        {
          "--water-color": waterColor,
        } as CSSProperties
      }
    >
      <div className="game-header">
        <button className="small-button" onClick={onBack}>
          MENU
        </button>

        <div>
          <h1>PIPE CONNECT</h1>

          <div className="difficulty-label">
            {difficulty.replace(/([A-Z])/g, " $1").toUpperCase()}{" "}
            {initialPuzzle.rows}×{initialPuzzle.cols}
          </div>
        </div>

        <div className="timer-wrapper">
          <Timer elapsedMs={elapsedMs} />
        </div>
      </div>

      <div className="status">
        {isCleared ? (
          <strong className="clear-message">CONNECTED!</strong>
        ) : (
          <span>
            Connected: {flowState.connectedIds.size}
            {" / "}
            {initialPuzzle.rows * initialPuzzle.cols}
          </span>
        )}
      </div>

      <Board
        tiles={tiles}
        rows={initialPuzzle.rows}
        cols={initialPuzzle.cols}
        sourceId={initialPuzzle.sourceId}
        connectedIds={flowState.connectedIds}
        distances={flowState.distances}
        isCleared={isCleared}
        onRotateTile={rotateTile}
      />

      <div className="controls">
        <button className="control-button" onClick={resetPuzzle}>
          RESET
        </button>

        <button className="control-button" onClick={newPuzzle}>
          NEW PUZZLE
        </button>
      </div>
    </main>
  );
}
