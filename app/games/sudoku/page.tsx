import { Metadata } from "next";
import SudokuPage from "./SudokuPage";

export const metadata: Metadata = {
  title: "Sudoku — The Arcade",
  description:
    "Solo Sudoku with pencil marks, mistake highlighting, and a daily seeded puzzle everyone gets the same copy of.",
};

export default function Page() {
  return <SudokuPage />;
}
