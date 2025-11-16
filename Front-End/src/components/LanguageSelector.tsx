import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    description: 'American English'
  },
  {
    code: 'pt',
    name: 'Português',
    flag: '🇧🇷',
    description: 'Português do Brasil'
  },
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    description: 'Español'
  }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>Idioma da Letra</Label>
      <div className="grid grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={cn(
              "p-3 border-2 rounded-lg transition-all hover:scale-105 flex flex-col items-center gap-2",
              value === lang.code
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-background/50 hover:border-primary/50"
            )}
          >
            {/* Force emoji rendering with proper font */}
            <span
              className="text-4xl leading-none"
              style={{
                fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
                fontSize: '3rem'
              }}
            >
              {lang.flag}
            </span>
            <div className="text-center">
              <p className="font-semibold text-sm">{lang.name}</p>
              <p className="text-xs text-muted-foreground">{lang.description}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        A letra será gerada no idioma selecionado
      </p>
    </div>
  );
};
