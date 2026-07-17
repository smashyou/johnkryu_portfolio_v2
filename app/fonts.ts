import {
  Space_Grotesk,
  JetBrains_Mono,
  Sora,
  IBM_Plex_Mono,
  Instrument_Serif,
  Outfit,
  Archivo,
  Press_Start_2P,
} from "next/font/google";

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-arcade",
  display: "swap",
  weight: "400",
});

export const fontVariables = [
  spaceGrotesk.variable,
  jetbrainsMono.variable,
  sora.variable,
  ibmPlexMono.variable,
  instrumentSerif.variable,
  outfit.variable,
  archivo.variable,
  pressStart2P.variable,
].join(" ");
