import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { StoreHydration } from "@/components/StoreHydration";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wird al-asas",
  description: "Complete your daily wird al-asas — four adhkar, every day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${ibmPlexArabic.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
