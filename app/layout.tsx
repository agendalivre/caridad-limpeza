import type { Metadata, Viewport } from "next";
import { Roboto_Serif, Roboto } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://caridad-limpeza.vercel.app"),
  alternates: { canonical: "/" },
  title: "Caridad Ceregido — Limpeza Profissional de Alto Padrão em Curitiba",
  description:
    "Agende sua limpeza residencial ou comercial diretamente com Caridad Ceregido. Atendimento premium, preços justos e agenda própria em Curitiba.",
  keywords: [
    "limpeza Curitiba",
    "faxina",
    "diarista",
    "limpeza pesada",
    "Caridad Ceregido",
  ],
  openGraph: {
    title: "Caridad Ceregido — Limpeza Profissional de Alto Padrão",
    description:
      "Atendimento premium de limpeza em Curitiba. Agende direto pelo WhatsApp.",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Caridad", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

// SEO local: dados estruturados para o Google (busca "diarista em Curitiba" etc.)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://caridad-limpeza.vercel.app/#negocio",
  name: "Caridad Ceregido — Limpeza Profissional",
  description:
    "Limpeza residencial e comercial em Curitiba: limpeza padrão, limpeza pesada e passadoria. Agende direto com a profissional, sem intermediários.",
  url: "https://caridad-limpeza.vercel.app",
  telephone: "+5541984226267",
  image: "https://caridad-limpeza.vercel.app/icon-512.png",
  priceRange: "R$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Curitiba",
    addressRegion: "PR",
    addressCountry: "BR",
  },
  areaServed: { "@type": "City", name: "Curitiba" },
  knowsAbout: ["limpeza residencial", "limpeza pesada", "limpeza comercial", "passadoria"],
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Limpeza Padrão", serviceType: "Limpeza residencial" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Limpeza Pesada", serviceType: "Faxina completa" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Limpeza Comercial", serviceType: "Limpeza de escritórios e lojas" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Passadoria", serviceType: "Passadoria de roupas" } },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${robotoSerif.variable} ${roboto.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
