import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, Volume2 } from "lucide-react";
import demoPhoto from "@/assets/demo-photo.jpg";

const carouselSteps = [
  {
    title: "Passo 1: Envie sua Foto",
    description: "Faça upload de qualquer imagem - paisagens, retratos, momentos especiais",
    image: demoPhoto,
  },
  {
    title: "Passo 2: IA Analisa a Imagem",
    description: "Nossa IA identifica cores, emoções e elementos visuais da sua foto",
    image: null,
  },
  {
    title: "Passo 3: Música é Gerada",
    description: "A IA transforma as características visuais em uma composição musical única",
    image: null,
  },
];

export const DemoPreview = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes mock
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSteps.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSteps.length) % carouselSteps.length);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">Veja Como é Fácil</h2>
          <p className="text-muted-foreground text-lg">
            Três passos simples para criar sua música
          </p>
        </div>

        {/* Carousel */}
        <div className="relative glass-effect rounded-3xl overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Content */}
            <div className="mb-8 space-y-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold">
                {carouselSteps[currentSlide].title}
              </h3>
              <p className="text-muted-foreground text-lg">
                {carouselSteps[currentSlide].description}
              </p>
            </div>

            {/* Visual */}
            <div className="aspect-video rounded-2xl bg-muted/30 mb-8 overflow-hidden relative">
              {carouselSteps[currentSlide].image ? (
                <img 
                  src={carouselSteps[currentSlide].image} 
                  alt="Demo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full gradient-primary animate-pulse" />
                    <p className="text-muted-foreground">
                      {currentSlide === 1 ? "Analisando..." : "Gerando música..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                className="rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              {/* Dots */}
              <div className="flex gap-2">
                {carouselSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 bg-primary' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                className="rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Final Preview */}
        <div className="mt-12 glass-effect rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Preview de Música Gerada</h3>
            <p className="text-muted-foreground">Ouça um exemplo de música criada pela IA</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Album Art */}
            <div className="aspect-square rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <img 
                src={demoPhoto} 
                alt="Demo music"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Music Info */}
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold mb-1">Pôr do Sol nas Montanhas</h4>
              <p className="text-muted-foreground">Criado por IA • 2:45</p>
            </div>

            {/* Player Controls */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-primary transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="hero"
                  size="icon"
                  className="w-16 h-16 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume}%, hsl(var(--muted)) ${volume}%, hsl(var(--muted)) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
