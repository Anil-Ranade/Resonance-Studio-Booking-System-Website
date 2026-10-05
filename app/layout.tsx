import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { OG_BASE, SITE_URL } from "@/lib/seo";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import MainContent from "./components/MainContent";
import ClearCache from "./components/ClearCache";
import Preloader from "./components/Preloader";
import SiteMotion from "./components/SiteMotion";
import { LocalBusinessStructuredData } from "./components/StructuredData";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#192a56',
};

export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: "Resonance Studio & Jam Room - Professional Recording Studio in Pune",
    template: "%s | Resonance Studio",
  },
  description: "Resonance Studio (Resonance Jam Room) is Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, podcast production, and band rehearsals.",
  keywords: [
    "resonance studio",
    "resonance studio pune",
    "resonance jamroom",
    "resonance jam room",
    "resonance jam room pune",
    "recording studio pune",
    "jam room pune",
    "music studio pune",
    "recording studio near me",
    "jamming studio pune",
    "band rehearsal space pune",
    "podcast studio pune",
    "mixing mastering pune",
    "karaoke room pune",
    "music production pune",
    "professional recording india",
    "dattawadi recording studio",
    "affordable recording studio",
    "book recording studio online",
  ],
  authors: [{ name: "Resonance Studio", url: "https://resonancejamroom.in" }],
  creator: "Resonance Jam Room",
  publisher: "Resonance Jam Room",
  
  // Canonical URL
  metadataBase: new URL(SITE_URL),
  // Every page is its own canonical unless its layout overrides it
  alternates: {
    canonical: "./",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Open Graph
  openGraph: {
    ...OG_BASE,
    title: "Resonance Jam Room - Professional Recording & Jam Room Studio in Pune",
    description: "Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, podcast production, karaoke sessions, and band rehearsals.",
  },
  // Title, description and image fill in from each page's openGraph
  twitter: {
    card: "summary_large_image",
  },
  
  
  // App & Manifest
  manifest: "/site.webmanifest",
  applicationName: "Resonance Jam Room",
  
  // Category
  category: "Music",
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Verification
  verification: {
    google: "sTyU0XH6JQInb8MWLV99jQw5GZLClk2sTGqroo5iU1s",
  },
  
  // Other
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "Pune",
    "geo.position": "18.4929;73.8505",
    "ICBM": "18.4929, 73.8505",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>

        <LocalBusinessStructuredData />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Z0N0MEPL81"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z0N0MEPL81');
          `}
        </Script>
      </head>
      <body
        className={`${dmSans.variable} antialiased bg-noise font-sans flex flex-col min-h-screen`}
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        {/* Clear cache on app open */}
        <ClearCache />

        {/* First-visit loading screen + site-wide GSAP motion */}
        <Preloader />
        <SiteMotion />

        {/* Navigation - conditionally renders based on route */}
        <Navigation />

        {/* Main Content - padding adjusts based on route */}
        <MainContent>
          {children}
        </MainContent>

        {/* Footer - conditionally renders based on route */}
        <Footer />
      </body>
    </html>
  );
}
