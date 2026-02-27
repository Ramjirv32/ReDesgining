import type { Metadata } from "next";
import { Anek_Latin, Anek_Tamil, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const anekLatin = Anek_Latin({
  subsets: ["latin"],
  variable: "--font-anek-latin",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const anekTamil = Anek_Tamil({
  subsets: ["tamil", "latin"],
  variable: "--font-anek-tamil",
  weight: ["400", "500", "600", "700", "800"],
});

const anekTamilCondensed = localFont({
  src: [
    {
      path: './fonts/AnekTamil_Condensed-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/AnekTamil_Condensed-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: "--font-anek-tamil-condensed",
});

export const metadata: Metadata = {
  title: "Ticpin - Explore Dining, Events, Play",
  description: "Your gateway to world-class sports and entertainment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${anekLatin.variable} ${inter.variable} ${anekTamil.variable} ${anekTamilCondensed.variable} font-sans antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
