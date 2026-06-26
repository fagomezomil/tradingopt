import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Disclaimer } from "@/components/Disclaimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Análisis Mercado",
  description: "Agente de análisis de mercado con backtesting y paper trading",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        <main className="mx-auto max-w-7xl w-full px-4 py-6 flex-1 flex flex-col">{children}</main>
        <footer className="mx-auto max-w-7xl w-full px-4 pb-6">
          <Disclaimer />
        </footer>
      </body>
    </html>
  );
}