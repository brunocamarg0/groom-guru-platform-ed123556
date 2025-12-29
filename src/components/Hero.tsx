import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-modern-barber.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-dark opacity-80 z-10" />
      
      <div className="container mx-auto px-4 py-32 relative z-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-black text-foreground leading-tight uppercase">
            Sistema de gestão{" "}
            <span className="text-primary drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">pro</span>{" "}
            para barbearias
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Agendamento online, controle financeiro e gestão completa. 
            Tudo que sua barbearia precisa em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button variant="hero" size="lg" asChild className="px-10 py-7">
              <Link to="/login">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="px-10 py-7">
              <Link to="#planos">Ver Planos</Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              14 dias grátis
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
              Sem cartão
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
