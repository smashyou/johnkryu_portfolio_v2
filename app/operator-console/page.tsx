import { Metadata } from "next";
import OperatorConsolePage from "./OperatorConsolePage";

export const metadata: Metadata = {
  title: "Operator Console — John K. Ryu",
  description:
    "RYU.OS boots in front of you — CRT scanlines, live module bars, a career rendered as git log. The boldest, most personality-forward way in.",
};

export default function Page() {
  return <OperatorConsolePage />;
}
