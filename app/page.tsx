import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Confianca } from "@/components/Confianca";
import { Servicos } from "@/components/Servicos";
import { Depoimentos } from "@/components/Depoimentos";
import { CtaFinal } from "@/components/CtaFinal";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <Nav />
      <Hero />
      <Confianca />
      <Servicos />
      <Depoimentos />
      <CtaFinal />
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}
