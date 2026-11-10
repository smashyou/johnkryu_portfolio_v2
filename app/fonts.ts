import localFont from "next/font/local";

// All fonts are self-hosted (latin subset, downloaded from Google Fonts).
// next/font/google in Next 14.2 crashes at build time when Google Fonts
// serves a font file from an extensionless URL, which now happens at random.
// Fonts served as one variable file use a single src with a weight range.

export const spaceGrotesk = localFont({
  src: "./assets/fonts/SpaceGrotesk-latin.woff2",
  weight: "400 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "./assets/fonts/JetBrainsMono-latin.woff2",
  weight: "400 500",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const sora = localFont({
  src: "./assets/fonts/Sora-latin.woff2",
  weight: "400 700",
  variable: "--font-sora",
  display: "swap",
});

export const ibmPlexMono = localFont({
  src: [
    { path: "./assets/fonts/IBMPlexMono-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./assets/fonts/IBMPlexMono-latin-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const instrumentSerif = localFont({
  src: [
    { path: "./assets/fonts/InstrumentSerif-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./assets/fonts/InstrumentSerif-latin-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const outfit = localFont({
  src: "./assets/fonts/Outfit-latin.woff2",
  weight: "300 600",
  variable: "--font-outfit",
  display: "swap",
});

export const archivo = localFont({
  src: "./assets/fonts/Archivo-latin.woff2",
  weight: "400 800",
  variable: "--font-archivo",
  display: "swap",
});

export const pressStart2P = localFont({
  src: [
    { path: "./assets/fonts/PressStart2P-latin-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-arcade",
  display: "swap",
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
