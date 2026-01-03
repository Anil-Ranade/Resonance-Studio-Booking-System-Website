import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import MainContent from "./components/MainContent";
import ClearCache from "./components/ClearCache";
import { LocalBusinessStructuredData } from "./components/StructuredData";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f0f1a',
};

export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: "Resonance Jam Room - Professional Recording & Jam Room Studio in Pune",
    template: "%s | Resonance Jam Room",
  },
  description: "Resonance Jam Room is Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, podcast production, karaoke sessions, and band rehearsals. State-of-the-art equipment at affordable rates.",
  keywords: [
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
    "resonance studio",
    "resonance jam room",
  ],
  authors: [{ name: "Resonance Jam Room", url: "https://resonancejamroom.in" }],
  creator: "Resonance Jam Room",
  publisher: "Resonance Jam Room",
  
  // Canonical URL
  metadataBase: new URL("https://resonancejamroom.in"),
  alternates: {
    canonical: "/",
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
    type: "website",
    locale: "en_IN",
    url: "https://resonancejamroom.in",
    siteName: "Resonance Jam Room",
    title: "Resonance Jam Room - Professional Recording & Jam Room Studio in Pune",
    description: "Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, podcast production, karaoke sessions, and band rehearsals.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Resonance Jam Room - Professional Recording Studio in Pune",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Resonance Jam Room - Professional Recording & Jam Room Studio in Pune",
    description: "Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, karaoke sessions, and band rehearsals.",
    images: ["/android-chrome-512x512.png"],
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
  
  // Verification (add your IDs here when available)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
  
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon"/>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <LocalBusinessStructuredData />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-noise font-sans flex flex-col min-h-screen`}
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
      >
        {/* Clear cache on app open */}
        <ClearCache />

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
