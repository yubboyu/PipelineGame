import { useState } from "react";

import MenuScreen from "./screens/MenuScreen";
import GameScreen from "./screens/GameScreen";
import HighScoreScreen from "./screens/HighScoreScreen";

import type { Difficulty } from "./game/types";

type Screen = "menu" | "game" | "highscores";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);

    setScreen("game");
  };

  if (screen === "game") {
    return (
      <GameScreen
        key={difficulty}
        difficulty={difficulty}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "highscores") {
    return <HighScoreScreen onBack={() => setScreen("menu")} />;
  }

  return (
    <MenuScreen
      onStartGame={startGame}
      onOpenHighScores={() => setScreen("highscores")}
    />
  );
}
