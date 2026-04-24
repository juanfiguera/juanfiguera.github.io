import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["300", "400"],
  subsets: ["latin"],
  display: "swap",
});

const title = "Juan Figuera — Product at the intersection of payments, AI, and authority";
const description =
  "Juan Figuera is Director of Product Management at American Express Digital Labs. Building APOA, an open-source authorization framework for AI agents on top of MCP.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Juan Figuera" }],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@juanbfiguera",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plex.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
