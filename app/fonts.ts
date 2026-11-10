import localFont from "next/font/local";
import {
  Space_Grotesk,
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

// Self-hosted: Google Fonts now serves some JetBrains Mono subsets from
// extensionless URLs, which crashes next/font/google in Next 14 at build time.
// This is the Google Fonts latin variable file (weights 400 and 500).
export const jetbrainsMono = localFont({
  src: "./assets/fonts/JetBrainsMono-latin.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "400 500",
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
