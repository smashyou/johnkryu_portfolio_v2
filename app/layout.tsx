import "./globals.css";
import { Metadata } from "next";

// Remove the Inter font import to avoid timeout issues
// We'll use system fonts instead

export const metadata: Metadata = {
  metadataBase: new URL("https://johnkryu.vercel.app"),
  title: "John Min Ryu - Full Stack Developer & Entrepreneur",
  description:
    "Software engineer and entrepreneur with 7+ years of experience. Specializing in full-stack development, cloud technologies, and digital marketing.",
  keywords: [
    "John Ryu",
    "Software Engineer",
    "Full Stack Developer",
    "React",
    "Next.js",
    "AWS",
    "Entrepreneur",
  ],
  authors: [{ name: "John Min Ryu" }],
  creator: "John Min Ryu",
  openGraph: {
    title: "John Min Ryu - Full Stack Developer & Entrepreneur",
    description:
      "Software engineer and entrepreneur with 7+ years of experience",
    url: "https://johnkryu.vercel.app",
    siteName: "John Min Ryu Portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "John Min Ryu - Full Stack Developer & Entrepreneur",
    description:
      "Software engineer and entrepreneur with 7+ years of experience",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-dark-900 text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
