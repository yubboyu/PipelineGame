import { DIFFICULTIES } from "../game/types";

import type { Difficulty } from "../game/types";

type MenuScreenProps = {
  onStartGame: (difficulty: Difficulty) => void;

  onOpenHighScores: () => void;
};

const difficulties: Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "veryHard",
  "expert",
];

export default function MenuScreen({
  onStartGame,
  onOpenHighScores,
}: MenuScreenProps) {
  return (
    <main className="app">
      <div className="menu-panel">
        <h1>PIPE CONNECT</h1>

        <p className="menu-subtitle">Select difficulty</p>

        <div className="difficulty-buttons">
          {difficulties.map((difficulty) => {
            const config = DIFFICULTIES[difficulty];

            return (
              <button
                key={difficulty}
                className="difficulty-button"
                onClick={() => onStartGame(difficulty)}
              >
                <strong>{config.label.toUpperCase()}</strong>

                <span>
                  {config.rows}
                  {" × "}
                  {config.cols}
                </span>

                <small>
                  {config.allowCross
                    ? "4-way pipes included"
                    : "Standard pipes"}
                </small>
              </button>
            );
          })}
        </div>

        <button className="highscore-menu-button" onClick={onOpenHighScores}>
          HIGHSCORES
        </button>
      </div>
    </main>
  );
}
