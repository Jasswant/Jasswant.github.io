import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock } from 'lucide-react';
import { getTranslation, type Language } from '../translations';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title?: string;
  description?: string;
  language: Language;
}

export function PasswordPrompt({ 
  isOpen, 
  onClose, 
  onSubmit,
  title,
  description,
  language
}: PasswordPromptProps) {
  const t = getTranslation(language);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
      setPassword('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pink-900 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {title || t.unlockAlbum}
          </DialogTitle>
          <DialogDescription>
            {description || t.enterPasswordToView}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-pink-900">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.enterPassword}
              className="border-pink-200 focus:border-pink-400"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              {t.cancel}
            </Button>
            <Button 
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              {t.unlock}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
