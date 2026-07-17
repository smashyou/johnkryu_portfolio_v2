import { Metadata } from "next";
import GamesHubPage from "./GamesHubPage";

export const metadata: Metadata = {
  title: "The Arcade — John K. Ryu",
  description:
    "Three games, zero downloads. Challenge the computer — or send a friend an invite link and settle it head-to-head.",
};

export default function Page() {
  return <GamesHubPage />;
}
