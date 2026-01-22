import { Scissors } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2">
                <Scissors className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black text-foreground uppercase tracking-tight">Barber Maestro</span>
            </div>
            <p className="text-muted-foreground font-medium">
              Sistema de gestão pro para barbearias.
            </p>
          </div>

          <div>
            <h3 className="font-black text-foreground mb-4 uppercase text-sm">Produto</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#funcionalidades" className="text-muted-foreground hover:text-primary transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link to="#planos" className="text-muted-foreground hover:text-primary transition-colors">
                  Planos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-foreground mb-4 uppercase text-sm">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="#contato" className="text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-foreground mb-4 uppercase text-sm">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Portal do Cliente
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Barber Maestro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
