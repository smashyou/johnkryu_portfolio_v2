import { Metadata } from "next";
import NeuralFieldPage from "./NeuralFieldPage";

export const metadata: Metadata = {
  title: "Neural Field — John K. Ryu",
  description:
    "A living particle network reacts to your cursor while a terminal types out the mission. Electric cyan on near-black — clean, credible AI-engineer energy.",
};

export default function Page() {
  return <NeuralFieldPage />;
}
