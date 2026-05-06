import type { Metadata } from "next";
import { Playfair_Display, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bonnie & Sam • June 13, 2026",
  description: "Bonnie and Sam are getting married June 13, 2026 in Granbury, TX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${libre.variable}`}>
      <Analytics />
      <body className="min-h-full flex flex-col">
        <Header />
        <Menu />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
