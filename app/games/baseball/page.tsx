import { Metadata } from "next";
import { Suspense } from "react";
import BaseballPage from "./BaseballPage";

export const metadata: Metadata = {
  title: "Baseball — The Arcade",
  description:
    "Classic Bulls & Cows: crack your opponent's 3-digit code first — vs computer or a friend over an invite link.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BaseballPage />
    </Suspense>
  );
}
