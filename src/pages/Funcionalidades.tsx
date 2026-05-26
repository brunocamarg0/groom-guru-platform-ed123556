import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { funcionalidades, Funcionalidade } from "@/data/funcionalidades";
import { Check, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Funcionalidades = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dono' | 'cliente' | 'geral'>('all');
  const navigate = useNavigate();

  // Filtrar funcionalidades de admin - não devem ser exibidas para clientes/donos
  const publicFeatures = funcionalidades.filter(f => f.category !== 'admin');

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'geral', label: 'Geral' },
    { value: 'dono', label: 'Dono de Barbearia' },
    { value: 'cliente', label: 'Cliente' },
  ];

  const filteredFeatures = publicFeatures.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const feature = selectedFeature 
    ? publicFeatures.find(f => f.id === selectedFeature)
    : null;

  const handleAccessFeature = (feature: Funcionalidade) => {
    if (feature.route) {
      navigate(feature.route);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Funcionalidades - Barber Maestro</title>
        <meta
          name="description"
          content="Conheça todas as funcionalidades do Barber Maestro para donos de barbearias e clientes: agenda, pagamentos, fidelidade, relatórios e mais."
        />
        <link rel="canonical" href="https://www.barbermaestro.com/funcionalidades" />
        <meta property="og:title" content="Funcionalidades - Barber Maestro" />
        <meta
          property="og:description"
          content="Conheça todas as funcionalidades do Barber Maestro para donos de barbearias e clientes."
        />
        <meta property="og:url" content="https://www.barbermaestro.com/funcionalidades" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      
      
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
            
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 uppercase">
              Todas as{" "}
              <span className="text-primary drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                Funcionalidades
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Descubra tudo que nosso sistema pode fazer por você
            </p>
          </div>

          {/* Filtros */}
          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar funcionalidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value as any)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Funcionalidades */}
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className="bg-card border-2 border-border hover:border-primary transition-all duration-200 hover:shadow-primary group flex flex-col cursor-pointer"
                    onClick={() => {
                      setSelectedFeature(feature.id);
                      handleScrollToTop();
                    }}
                  >
                    <CardHeader>
                      <div className="bg-primary/10 w-fit p-3 mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-foreground font-black uppercase text-lg">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <CardDescription className="text-muted-foreground font-medium mb-4 flex-1">
                        {feature.shortDescription}
                      </CardDescription>
                      <Button
                        variant="outline"
                        className="w-full mt-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFeature(feature.id);
                          handleScrollToTop();
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Nenhuma funcionalidade encontrada com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {feature && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/10 p-3">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-black uppercase">
                    {feature.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-base text-muted-foreground">
                  {feature.fullDescription}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <h4 className="font-bold text-lg mb-3 text-foreground">Principais Recursos:</h4>
                <ul className="space-y-2">
                  {feature.features.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFeature(null)}
                >
                  Fechar
                </Button>
                {feature.route && (
                  <Button 
                    onClick={() => {
                      handleAccessFeature(feature);
                      setSelectedFeature(null);
                    }}
                  >
                    Acessar Funcionalidade
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionalidades;
