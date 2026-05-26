import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Barber Maestro - Sistema de Gestão para Barbearias</title>
        <meta
          name="description"
          content="Sistema completo de gestão para barbearias: agendamentos online, pagamentos via Pix, fidelidade, relatórios e muito mais."
        />
        <link rel="canonical" href="https://www.barbermaestro.com/" />
        <meta property="og:title" content="Barber Maestro - Sistema de Gestão para Barbearias" />
        <meta
          property="og:description"
          content="Sistema completo de gestão para barbearias: agendamentos online, pagamentos via Pix, fidelidade, relatórios e muito mais."
        />
        <meta property="og:url" content="https://www.barbermaestro.com/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
