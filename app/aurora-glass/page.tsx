import { Metadata } from "next";
import AuroraGlassPage from "./AuroraGlassPage";

export const metadata: Metadata = {
  title: "Aurora Glass — John K. Ryu",
  description:
    "Aurora light drifts behind holographic glass and serif editorial type. The most elegant room in the house — slow scroll recommended.",
};

export default function Page() {
  return <AuroraGlassPage />;
}
