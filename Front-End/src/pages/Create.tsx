import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2, Upload, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateMusic } from "@/services/api";
import { useQueue } from "@/contexts/QueueContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useUser } from "@/contexts/UserContext";

const genres = [
  "Pop",
  "Rock",
  "Jazz",
  "Eletrônica",
  "Clássica",
  "Ambient",
  "Lo-fi",
  "Hip-Hop",
  "Indie",
];

export const Create = () => {
  const navigate = useNavigate();
  const { setQueue } = useQueue();
  const { setPlayerState } = usePlayer();
  const { userName, setUserName } = useUser();
  const [songName, setSongName] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        if (!songName) {
          setSongName(file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // Validations
    if (!userName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu nome",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma foto",
        variant: "destructive",
      });
      return;
    }

    // Save userName to localStorage
    localStorage.setItem("wavelength_user_name", userName);

    setIsGenerating(true);
    setGenerationStatus("Iniciando geração...");
    setGenerationProgress(0);
    setElapsedTime(0);

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Simulated progress (real progress will come from backend in future)
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    try {
      setGenerationStatus("Analisando sua foto...");
      setGenerationProgress(10);

      // Call backend API (fixed 30s instrumental)
      const result = await generateMusic(imageFile, {
        userName,
        songName: songName || undefined,
        genre: genre || undefined,
        tags: tags || undefined,
        duration: 30,
        hasVocals: false,
        hasLyrics: false,
      });

      setGenerationProgress(100);
      setGenerationStatus("Música gerada!");
      clearInterval(timerInterval);
      clearInterval(progressInterval);

      toast({
        title: "Música gerada!",
        description: `${result.caption}`,
      });

      // Create Song object and add to queue
      const newSong = {
        id: result.id,
        song_name: result.song_name || songName || "Música Gerada",
        user_name: userName,
        image_path: result.image_url,
        audio_path: result.audio_url,
        caption: result.caption,
        genre: genre || result.metadata?.genre,
        tags: tags,
        duration: 30,
        has_vocals: false,
        has_lyrics: false,
        lyrics: null,
        is_liked: false,
        created_at: new Date().toISOString(),
      };

      // Add to queue and start playing
      setQueue([newSong], 0);
      setPlayerState("maximized");

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error generating music:", error);
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setIsGenerating(false);
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : "Não foi possível gerar a música",
        variant: "destructive",
      });
    }
  };

  if (isGenerating) {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-4">
          {/* Animated circles */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full gradient-primary animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
              <Music2 className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>

          {/* Status and Progress */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Gerando sua música...</h2>
            <p className="text-muted-foreground text-lg animate-pulse">
              {generationStatus}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{Math.round(generationProgress)}%</span>
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>

            {/* Additional info */}
            <p className="text-sm text-muted-foreground mt-4">
              Isso pode levar de 30 a 60 segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <div className="flex items-center gap-2">
              <Music2 className="w-6 h-6 text-primary" />
              <span className="font-semibold">Criar Música</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-effect rounded-3xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold mb-4 block">
                    Envie sua Foto
                  </Label>
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-border overflow-hidden group cursor-pointer hover:border-primary transition-colors">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <div className="text-center">
                            <Upload className="w-12 h-12 mx-auto mb-2 text-white" />
                            <p className="text-white font-medium">
                              Trocar foto
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="font-medium mb-2">Clique para enviar</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG ou WEBP
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userName">Seu Nome *</Label>
                  <Input
                    id="userName"
                    placeholder="Digite seu nome..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="songName">Nome da Música</Label>
                  <Input
                    id="songName"
                    placeholder="Digite o nome da sua música..."
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">
                    Gênero Musical <span className="text-muted-foreground">(Opcional)</span>
                  </Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g.toLowerCase()}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">
                    Tags <span className="text-muted-foreground">(Opcional)</span>
                  </Label>
                  <Input
                    id="tags"
                    placeholder="feliz, nostálgico, energético..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Separe as tags com vírgulas
                  </p>
                </div>

                <div className="p-4 rounded-lg glass-effect">
                  <p className="text-sm text-muted-foreground">
                    <strong>📝 Nota:</strong> Todas as músicas são geradas como <strong>instrumental de 30 segundos</strong>
                  </p>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!imagePreview || !userName.trim()}
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Gerar Música
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Create;
