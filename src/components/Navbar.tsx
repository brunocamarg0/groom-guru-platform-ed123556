import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary p-2">
              <Scissors className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black text-foreground uppercase tracking-tight">BarberPro</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="#funcionalidades" className="text-foreground hover:text-primary transition-colors font-bold uppercase text-sm">
              Funcionalidades
            </Link>
            <Link to="#planos" className="text-foreground hover:text-primary transition-colors font-bold uppercase text-sm">
              Planos
            </Link>
            <Link to="#contato" className="text-foreground hover:text-primary transition-colors font-bold uppercase text-sm">
              Contato
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/cadastro">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
