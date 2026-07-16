import { Metadata } from "next";
import TheMachinePage from "./TheMachinePage";

export const metadata: Metadata = {
  title: "The Machine — John K. Ryu",
  description:
    "A processor tears itself apart as you scroll — each layer a career chapter — then reassembles into one running machine.",
};

export default function Page() {
  return <TheMachinePage />;
}
