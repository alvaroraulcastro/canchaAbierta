import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "canchaAbierta",
    template: "%s · canchaAbierta",
  },
  description: "Encuentra jugadores y únete a partidos de pádel y babyfútbol en Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={outfit.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-full bg-brand-300 px-4 py-2 text-sm font-semibold text-brand-950 focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <div id="main-content" className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
