import Link from "next/link";
import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import HeaderNav from "@/components/HeaderNav";
import HeroScene from "@/components/HeroScene";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VerifiCAD — disegnatori CAD verificati",
  description:
    "Il portale che collega aziende e disegnatori CAD, con pagamenti protetti fino a consegna verificata.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${mono.variable} ${body.variable} antialiased`}>
        <HeroScene />
        <header className="border-b border-[var(--blueprint-line)]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/come-funziona" className="flex items-center gap-2">
              <span className="font-mono-cad text-[var(--blueprint-accent-strong)] text-sm tracking-widest">
                [+]
              </span>
              <span className="font-mono-cad text-lg tracking-tight">
                Verifi<span className="text-[var(--blueprint-accent)]">CAD</span>
              </span>
            </Link>
            <HeaderNav />
          </div>
        </header>
        {children}
        <footer className="border-t border-[var(--blueprint-line)] mt-24">
          <div className="max-w-5xl mx-auto px-6 py-6 text-xs font-mono-cad text-[var(--blueprint-text-dim)] flex justify-between">
            <span>VERIFICAD — SCALA 1:1 — REV. MVP</span>
            <span>commissione 10% + 10% · pagamento protetto</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
