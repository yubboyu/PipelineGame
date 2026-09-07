import { useState } from "react";

import { clearHighScores, loadHighScores } from "../storage/highScores";

import { DIFFICULTIES } from "../game/types";

import type { Difficulty } from "../game/types";

type HighScoreScreenProps = {
  onBack: () => void;
};

const difficulties: Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "veryHard",
  "expert",
];

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100);

  const minutes = Math.floor(totalTenths / 600);

  const seconds = Math.floor((totalTenths % 600) / 10);

  const tenths = totalTenths % 10;

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}.` +
    tenths
  );
}

export default function HighScoreScreen({ onBack }: HighScoreScreenProps) {
  const [scores, setScores] = useState(() => loadHighScores());

  const handleClear = () => {
    clearHighScores();

    setScores({
      easy: [],
      normal: [],
      hard: [],
      veryHard: [],
      expert: [],
    });
  };

  return (
    <main className="app">
      <div className="highscore-header">
        <button className="small-button" onClick={onBack}>
          BACK
        </button>

        <h1>HIGHSCORES</h1>

        <div />
      </div>

      <div className="highscore-grid">
        {difficulties.map((difficulty) => {
          const config = DIFFICULTIES[difficulty];

          const list = scores[difficulty];

          return (
            <section key={difficulty} className="highscore-card">
              <h2>{config.label}</h2>

              <div className="highscore-size">
                {config.rows}
                {" × "}
                {config.cols}
              </div>

              {list.length === 0 ? (
                <p className="no-score">No records</p>
              ) : (
                <ol>
                  {list.map((time, index) => (
                    <li key={`${time}-${index}`}>
                      <span className="score-rank">{index + 1}.</span>

                      <strong>{formatTime(time)}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      <button className="clear-records-button" onClick={handleClear}>
        CLEAR RECORDS
      </button>
    </main>
  );
}
