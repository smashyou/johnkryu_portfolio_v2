import { Metadata } from "next";
import JarvisPage from "./JarvisPage";

export const metadata: Metadata = {
  title: "JARVIS — John K. Ryu",
  description:
    "The chief-of-staff AI system behind my holding company — how it's organized, what it does every day, and where to see it live.",
};

export default function Page() {
  return <JarvisPage />;
}
