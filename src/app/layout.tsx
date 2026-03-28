import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "IPL Adda — Clean Prediction Game",
  description: "Minimalist IPL prediction game. No signup. No friction.",
  keywords: ["IPL", "cricket prediction"],
  openGraph: {
    title: "IPL Adda — Clean Prediction Game",
    description: "Minimalist IPL prediction game with friends. No app, no signup!",
    siteName: "IPL Adda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IPL Adda — Clean Prediction Game",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IPL Adda",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "h-full", "antialiased", inter.variable, outfit.variable, "font-sans", geist.variable)}>
      <body className="min-h-[100dvh] flex flex-col bg-[#050505] text-[#FAFAFA] selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
