import { Smartphone, Zap, Heart } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Design Responsivo",
    description: "Interface otimizada para telas de todos os tamanhos",
  },
  {
    icon: Zap,
    title: "Performance Rápida",
    description: "Carregamento instantâneo e navegação fluida",
  },
  {
    icon: Heart,
    title: "Experiência Intuitiva",
    description: "Criado pensando primeiro na experiência mobile",
  },
];

export const MobileOptimized = () => {
  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Experiência Otimizada para Mobile
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Criado com foco em dispositivos móveis para que você crie música onde estiver
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl glass-effect hover-lift cursor-pointer"
              >
                <div className="mb-4 w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
