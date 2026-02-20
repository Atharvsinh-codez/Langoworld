import type { Metadata } from "next";
import { Geist, Outfit, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./external-styles.css";
import { LingoProvider } from "@/lib/lingo";
import { TranslationLoader } from "@/components/translation-loader";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LangoWorld - Multilingual Tool",
  description: "Summarize any YouTube video, upload & analyze videos, translate to 25+ languages, and listen with AI voice — all from one beautiful canvas.",
  keywords: ["multilingual", "audio", "translation", "text-to-speech", "AI summarizer", "YouTube summarizer", "video analysis"],
  authors: [{ name: "LangoWorld" }],
  creator: "LangoWorld",
  publisher: "LangoWorld",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://langoworld.app"),
  icons: {
    icon: "/favicon-rounded.png",
    shortcut: "/favicon-rounded.png",
    apple: "/favicon-rounded.png",
  },
  openGraph: {
    title: "LangoWorld - Multilingual Tool",
    description: "Summarize any YouTube video, translate to 25+ languages, and listen with AI voice",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://langoworld.app",
    siteName: "LangoWorld",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/pg-image.png",
        width: 1200,
        height: 630,
        alt: "LangoWorld - Multilingual Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LangoWorld - Multilingual Tool",
    description: "Summarize any YouTube video, translate to 25+ languages, and listen with AI voice",
    creator: "@langoworld",
    images: ["/pg-image.png"],
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${outfit.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LingoProvider>
            {children}
            <TranslationLoader />
            <Toaster />
          </LingoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
