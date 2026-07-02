import type { Metadata, Viewport } from "next";

// PWA separada para Caridad: instala o PAINEL (start_url /painel), não a landing.
export const metadata: Metadata = {
  title: "Agenda · Caridad",
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Agenda Caridad", statusBarStyle: "default" },
  icons: { icon: "/icon-painel-192.png", apple: "/apple-touch-icon-painel.png" },
};

export const viewport: Viewport = { themeColor: "#17150f" };

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
