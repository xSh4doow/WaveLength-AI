import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music2 } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wavelength
            </span>
          </div>

          {/* Login Button */}
          <Button variant="default" size="default" onClick={() => navigate("/dashboard")}>
            Entrar
          </Button>
        </div>
      </div>
    </header>
  );
};
