import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LanguageSwitcherProps {
  language: 'en' | 'id';
  onLanguageChange: (language: 'en' | 'id') => void;
}

export function LanguageSwitcher({ language, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-pink-300 text-pink-700 hover:bg-pink-50 gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{language === 'en' ? 'English' : 'Indonesia'}</span>
          <span className="sm:hidden">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem
          onClick={() => onLanguageChange('en')}
          className={`cursor-pointer ${
            language === 'en' ? 'bg-pink-50 text-pink-900' : ''
          }`}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onLanguageChange('id')}
          className={`cursor-pointer ${
            language === 'id' ? 'bg-pink-50 text-pink-900' : ''
          }`}
        >
          <span className="mr-2">🇮🇩</span>
          Indonesia
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
