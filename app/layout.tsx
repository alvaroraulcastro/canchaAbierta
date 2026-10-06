import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

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
    <html lang="es-CL">
      <body className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <SiteHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
