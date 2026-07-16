import { Metadata } from "next";
import KnowledgeGraphPage from "./KnowledgeGraphPage";

export const metadata: Metadata = {
  title: "3D Knowledge Graph — John K. Ryu",
  description:
    "Skills, ventures, and history orbit as a draggable 3D constellation. Grab it, spin it, hover the nodes — everything is connected.",
};

export default function Page() {
  return <KnowledgeGraphPage />;
}
