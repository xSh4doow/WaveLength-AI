import { useState, useEffect } from "react";
import { Image, Brain, Music, FileAudio } from "lucide-react";

const steps = [
  { icon: Image, title: "Foto Enviada", color: "text-primary" },
  { icon: Brain, title: "IA Analisa", color: "text-secondary" },
  { icon: Music, title: "Gera Música", color: "text-accent" },
  { icon: FileAudio, title: "MP3 Criado", color: "text-primary" },
];

export const ProcessAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold">Como Funciona</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transforme suas memórias visuais em experiências sonoras únicas
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            
            return (
              <div
                key={index}
                className={`relative p-6 rounded-2xl transition-all duration-500 ${
                  isActive 
                    ? 'glass-effect scale-105 glow-primary' 
                    : 'bg-card/20'
                }`}
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`mb-4 ${step.color} transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="w-12 h-12 mx-auto" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-center">{step.title}</h3>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            );
          })}
        </div>

        {/* Visual Flow Animation */}
        <div className="glass-effect rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 animate-pulse" />
          
          <div className="relative flex items-center justify-center gap-8 flex-wrap">
            {/* Photo */}
            <div className={`transition-all duration-700 ${currentStep >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary p-1">
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <Image className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className={`hidden sm:block transition-opacity duration-500 ${currentStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
            </div>

            {/* AI Brain */}
            <div className={`transition-all duration-700 ${currentStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary to-accent p-1 pulse-glow">
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <Brain className="w-12 h-12 text-secondary" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className={`hidden sm:block transition-opacity duration-500 ${currentStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent rounded-full" />
            </div>

            {/* Music Note */}
            <div className={`transition-all duration-700 ${currentStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-primary p-1">
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <Music className="w-12 h-12 text-accent animate-wave" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className={`hidden sm:block transition-opacity duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-20'}`}>
              <div className="w-16 h-1 bg-gradient-to-r from-accent to-primary rounded-full" />
            </div>

            {/* MP3 File */}
            <div className={`transition-all duration-700 ${currentStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary p-1 glow-accent">
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <FileAudio className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
