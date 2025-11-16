import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2, Upload, ArrowLeft, Wand2, Mic } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { useTaskPolling } from "@/hooks/useTaskPolling";
import { ImagePreview } from "@/components/ImagePreview";
import { LanguageSelector } from "@/components/LanguageSelector";

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [vocalType, setVocalType] = useState<"instrumental" | "with_lyrics">("instrumental");
  const [includeTitleInLyrics, setIncludeTitleInLyrics] = useState(true);
  const [language, setLanguage] = useState("en");  // Language for lyrics
  const [taskId, setTaskId] = useState<string | null>(null);
  const [songId, setSongId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use task polling hook
  const { status: pollStatus, song: pollSong, error: pollError, progress: pollProgress } = useTaskPolling({
    taskId,
    songId,
    enabled: isGenerating && taskId !== null,
    interval: 10000, // Poll every 10 seconds
    onComplete: (song) => {
      // Task completed!
      setGenerationStatus("Música gerada!");
      setGenerationProgress(100);
      setIsGenerating(false);

      // Clear localStorage
      localStorage.removeItem('wavelength_generating');

      // Add to queue and open player
      setQueue([song], 0);
      setPlayerState("maximized");

      toast({
        title: "Música gerada!",
        description: `"${song.song_name}" está pronta!`,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    },
    onError: (error) => {
      setIsGenerating(false);
      setGenerationStatus("Erro na geração");
      localStorage.removeItem('wavelength_generating');

      toast({
        title: "Erro na geração",
        description: error,
        variant: "destructive",
      });
    }
  });

  // Update progress from polling
  useEffect(() => {
    if (pollProgress > 0) {
      setGenerationProgress(pollProgress);
    }
  }, [pollProgress]);

  // Restore generation state from localStorage if page was refreshed
  useEffect(() => {
    const savedGeneration = localStorage.getItem('wavelength_generating');
    if (savedGeneration) {
      const data = JSON.parse(savedGeneration);
      const startTime = data.startTime;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      // If generation started less than 5 minutes ago, restore state
      if (elapsed < 300) {
        setIsGenerating(true);
        setGenerationStatus("Gerando sua música...");
        setElapsedTime(elapsed);
        setGenerationProgress(Math.min(90, (elapsed / 180) * 90)); // Max 90% until complete

        // Restore task_id and song_id if available
        if (data.taskId) {
          setTaskId(data.taskId);
        }
        if (data.songId) {
          setSongId(data.songId);
        }

        // Continue timer
        const timerInterval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Cleanup function to clear interval
        return () => {
          clearInterval(timerInterval);
        };
      } else {
        // Generation too old, remove it
        localStorage.removeItem('wavelength_generating');
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];  // Only get the first file (no multiple)

    if (!file) return;

    // Check if already have 3 images
    if (imageFiles.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Você já adicionou 3 imagens (máximo permitido)",
        variant: "destructive",
      });
      return;
    }

    // Add file to array (only 1 at a time)
    setImageFiles([...imageFiles, file]);

    // Auto-fill song name from first image if empty
    if (!songName && imageFiles.length === 0) {
      setSongName(file.name.replace(/\.[^/.]+$/, ""));
    }

    // Clear file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleAddMoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    // Validations
    if (imageFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos uma foto",
        variant: "destructive",
      });
      return;
    }

    if (!userName || !userName.trim()) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar música",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Iniciando geração...");
    setGenerationProgress(0);
    setElapsedTime(0);

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    try {
      setGenerationStatus(imageFiles.length > 1 ? "Analisando suas fotos..." : "Analisando sua foto...");
      setGenerationProgress(10);

      // Call backend API (returns task_id immediately)
      const result = await generateMusic(imageFiles, {
        userName,
        songName: songName || undefined,
        genre: genre || undefined,
        tags: tags || undefined,
        duration: 30,
        hasVocals: vocalType === "with_lyrics",
        hasLyrics: vocalType === "with_lyrics",
        includeTitleInLyrics: includeTitleInLyrics,
        language: language,  // Language for lyrics
      });

      if (result.status === "SUCCESS") {
        // Mock mode - completed immediately
        setGenerationProgress(100);
        setGenerationStatus("Música gerada!");
        clearInterval(timerInterval);
        setIsGenerating(false);

        toast({
          title: "Música gerada!",
          description: "Música mock criada (SunoAPI não disponível)",
        });

        // Navigate to dashboard
        setTimeout(() => navigate("/dashboard"), 1000);
      } else if (result.status === "PENDING" && result.task_id) {
        // SunoAPI mode - start polling
        setTaskId(result.task_id);
        setSongId(result.song_id);
        setGenerationStatus("Gerando música com IA...");
        setGenerationProgress(20);

        // Save generation state to localStorage (with task_id)
        localStorage.setItem('wavelength_generating', JSON.stringify({
          startTime: Date.now(),
          songName,
          genre,
          tags,
          taskId: result.task_id,
          songId: result.song_id
        }));

        toast({
          title: "Geração iniciada!",
          description: "Sua música está sendo criada. Aguarde...",
        });

        // useTaskPolling hook will handle the rest
      } else {
        throw new Error("Resposta inesperada do servidor");
      }

    } catch (error) {
      console.error("Error generating music:", error);
      clearInterval(timerInterval);
      setIsGenerating(false);

      // Clear localStorage generation state
      localStorage.removeItem('wavelength_generating');

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
              A geração pode demorar até 3 minutos...
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
                    Envie suas Fotos (1-3)
                  </Label>

                  {/* Upload area - show only if no images or less than 3 */}
                  {imageFiles.length < 3 && (
                    <div className="relative aspect-square rounded-2xl border-2 border-dashed border-border overflow-hidden group cursor-pointer hover:border-primary transition-colors mb-4">
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="font-medium mb-2">
                            {imageFiles.length === 0 ? "Clique para enviar" : "Adicionar mais fotos"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG ou WEBP (máx. 3)
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Image preview component */}
                  <ImagePreview
                    images={imageFiles}
                    onRemoveImage={handleRemoveImage}
                    onAddMore={imageFiles.length < 3 ? handleAddMoreClick : undefined}
                    maxImages={3}
                  />
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
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

                {/* Vocal Type Selection */}
                <div className="space-y-2">
                  <Label>Tipo de Música</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setVocalType("instrumental")}
                      className={cn(
                        "p-4 border-2 rounded-lg transition-all hover:scale-105",
                        vocalType === "instrumental"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/50"
                      )}
                    >
                      <Music2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold">Instrumental</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Música sem vocais
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVocalType("with_lyrics")}
                      className={cn(
                        "p-4 border-2 rounded-lg transition-all hover:scale-105",
                        vocalType === "with_lyrics"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/50"
                      )}
                    >
                      <Mic className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold">Com Letra Gerada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Letra criada pela IA
                      </p>
                    </button>
                  </div>
                </div>

                {/* Include Title in Lyrics Checkbox (only for vocals) */}
                {vocalType === "with_lyrics" && (
                  <>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-background/50">
                      <input
                        type="checkbox"
                        id="includeTitleInLyrics"
                        checked={includeTitleInLyrics}
                        onChange={(e) => setIncludeTitleInLyrics(e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <Label htmlFor="includeTitleInLyrics" className="cursor-pointer">
                        Incluir nome da música na letra?
                      </Label>
                    </div>

                    {/* Language Selector */}
                    <LanguageSelector
                      value={language}
                      onChange={setLanguage}
                    />
                  </>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={imageFiles.length === 0 || !userName?.trim()}
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
