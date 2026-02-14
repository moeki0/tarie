import type { Metadata } from "next";
import {
  Lora,
  M_PLUS_1p,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Playfair_Display,
  Zen_Kaku_Gothic_New,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LocaleProvider } from "@/lib/i18n";
import { AppHeader } from "./AppHeader";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mplus = M_PLUS_1p({
  variable: "--font-mplus-1p",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "tarie - バズらない写真に、居場所をつくる",
    template: "%s - tarie",
  },
  description:
    "tarieはバズらない写真に居場所をつくるサービスです。写真を並べて一冊の写真集にして、URLで誰かに届けられます。",
  openGraph: {
    title: "tarie - バズらない写真に、居場所をつくる",
    description:
      "バズらない写真に居場所をつくる。写真を並べて一冊の写真集にして、URLで誰かに届けられます。",
    siteName: "tarie",
    type: "website",
    images: [{ url: "/photos.jpg" }],
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJp.variable} ${notoSerifJp.variable} ${playfairDisplay.variable} ${lora.variable} ${zenKaku.variable} ${mplus.variable} antialiased`}
      >
        <LocaleProvider>
          <AppHeader />
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
