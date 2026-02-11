import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Básico",
    slug: "basico",
    price: "R$ 97",
    description: "Ideal para barbearias iniciantes",
    features: [
      "Até 100 agendamentos/mês",
      "1 barbeiro",
      "Agendamento online",
      "Notificações por email",
      "Suporte por email",
    ],
  },
  {
    name: "Profissional",
    slug: "profissional",
    price: "R$ 197",
    description: "Perfeito para barbearias em crescimento",
    features: [
      "Agendamentos ilimitados",
      "Até 5 barbeiros",
      "Agendamento online",
      "Notificações SMS e WhatsApp",
      "Relatórios avançados",
      "Suporte prioritário",
      "App personalizado",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "Personalizado",
    description: "Para redes de barbearias",
    features: [
      "Tudo do Profissional",
      "Barbeiros ilimitados",
      "Múltiplas unidades",
      "API personalizada",
      "Gerente de conta dedicado",
      "Treinamento personalizado",
    ],
  },
];

const Pricing = () => {
  return (
    <section id="planos" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
      <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 uppercase">
            Planos <span className="text-primary drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">sem enrolação</span>
          </h2>
          <p className="text-xl text-muted-foreground font-medium">
            Preço justo para o que você precisa
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`bg-card border-2 relative ${
                plan.popular
                  ? "border-primary shadow-primary scale-105"
                  : "border-border hover:border-primary/50"
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-5 py-1.5 text-xs font-black uppercase tracking-wider">
                  Top
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl text-foreground mb-2 font-black uppercase">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground mb-4 font-medium">
                  {plan.description}
                </CardDescription>
                <div className="text-5xl font-black text-primary">
                  {plan.price}
                  {plan.price !== "Personalizado" && (
                    <span className="text-base text-muted-foreground font-bold">/mês</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5 stroke-[3]" />
                      <span className="text-foreground font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full py-6"
                  asChild
                >
                  {plan.price === "Personalizado" ? (
                    <Link to="/login">Falar Agora</Link>
                  ) : (
                    <Link to={`/checkout-assinatura?plano=${plan.slug}`}>
                      Assinar agora
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
