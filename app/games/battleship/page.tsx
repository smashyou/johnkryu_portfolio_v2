import { Metadata } from "next";
import { Suspense } from "react";
import BattleshipPage from "./BattleshipPage";

export const metadata: Metadata = {
  title: "Battleship — The Arcade",
  description: "Sink the enemy fleet — classic Battleship vs the computer or a friend, no downloads.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BattleshipPage />
    </Suspense>
  );
}
