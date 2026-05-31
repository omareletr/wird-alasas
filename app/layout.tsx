import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans, Scheherazade_New } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { StoreHydration } from "@/components/StoreHydration";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans-latin",
  display: "swap",
});

const scheherazadeNew = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wird al-asas",
  description: "Complete your daily wird al-asas — four adhkar, every day.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "wird",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${scheherazadeNew.variable} ${geistMono.variable} ${ibmPlexSans.variable}`}>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=JSON.parse(localStorage.getItem('wird-theme')||'{}');if(t.state?.theme==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <StoreHydration />
          {children}
        </ThemeProvider>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          src="/sw-register.js"
        />
      </body>
    </html>
  );
}
