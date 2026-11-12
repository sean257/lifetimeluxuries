import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Lifetime Luxuries · Men's watches & accessories, Harare",
    template: "%s · Lifetime Luxuries",
  },
  description:
    "Automatic, chronograph and dress watches for men, with straps, winders and cufflinks to match. Order on WhatsApp, delivered in Harare and nationwide.",
  applicationName: "Lifetime Luxuries",
  openGraph: {
    type: "website",
    siteName: "Lifetime Luxuries",
    locale: "en_GB",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F5",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${pinyon.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
