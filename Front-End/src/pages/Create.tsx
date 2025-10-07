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
  const [songName, setSongName] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");

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
    if (!imageFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma foto",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Analisando sua foto...");

    try {
      // Call backend API
      const duration = 15; // Default duration
      const result = await generateMusic(imageFile, duration);

      setGenerationStatus("Música gerada!");

      toast({
        title: "Música gerada!",
        description: `${result.caption}`,
      });

      // Navigate to player with generated music data
      navigate("/player/new", {
        state: {
          musicData: result,
          songName: songName || "Música Gerada",
          imagePreview: imagePreview
        }
      });
    } catch (error) {
      console.error("Error generating music:", error);
      setIsGenerating(false);
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : "Não foi possível gerar a música",
        variant: "destructive",
      });
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full gradient-primary animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Gerando sua música...</h2>
            <p className="text-muted-foreground animate-pulse">
              {generationStatus}
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

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!imagePreview}
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
