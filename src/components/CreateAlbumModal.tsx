import { useState } from 'react';
import { Album, MediaItem } from '../types';
import { api } from '../services/api';
import { hashPassword } from '../utils/crypto';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Upload, X, Lock } from 'lucide-react';
import { getTranslation, type Language } from '../translations';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (album: Album) => void;
  parentAlbum?: Album | null;
  language: Language;
}

export function CreateAlbumModal({ isOpen, onClose, onCreateAlbum, parentAlbum, language }: CreateAlbumModalProps) {
  const t = getTranslation(language);
  const [title, setTitle] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [customCover, setCustomCover] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIsProcessing(true);

    const newMedia: MediaItem[] = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (isImage || isVideo) {
        try {
          const { url } = await api.uploadFile(file);
          newMedia.push({
            id: `${Date.now()}-${Math.random()}`,
            type: isImage ? 'image' : 'video',
            url,
            filename: file.name,
          });
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
        }
      }
    }

    setMedia([...media, ...newMedia]);
    setIsProcessing(false);
  };

  const handleRemoveMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsProcessing(true);
      try {
        const { url } = await api.uploadFile(file);
        setCustomCover(url);
      } catch (error) {
        console.error('Failed to upload cover:', error);
      }
      setIsProcessing(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !publisherName) {
      alert(t.fillAllFields);
      return;
    }

    if (isLocked) {
      if (!password) {
        alert(t.fillAllFields);
        return;
      }
      if (password !== confirmPassword) {
        alert(t.passwordsDoNotMatch);
        return;
      }
      if (password.length < 4) {
        alert(t.passwordTooShort);
        return;
      }
    }

    const passwordHash = isLocked ? await hashPassword(password) : undefined;

    const newAlbum: Album = {
      id: `${Date.now()}`,
      title,
      publisherName,
      publishDate,
      coverImage: customCover || (media.length > 0 ? media[0].url : ''),
      media,
      albums: [],
      isLocked,
      passwordHash,
    };

    onCreateAlbum(newAlbum);
    
    // Reset form
    setTitle('');
    setPublisherName('');
    setPublishDate(new Date().toISOString().split('T')[0]);
    setMedia([]);
    setCustomCover('');
    setIsLocked(false);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pink-900">
            {parentAlbum ? `${t.createNestedAlbumDesc} "${parentAlbum.title}"` : t.createNewAlbum}
          </DialogTitle>
          <DialogDescription>
            {parentAlbum ? t.createNestedAlbumDesc : t.createAlbumDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-pink-900">{t.albumTitle}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.albumTitlePlaceholder}
              className="border-pink-200 focus:border-pink-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="publisher" className="text-pink-900">{t.publisherName}</Label>
            <Input
              id="publisher"
              value={publisherName}
              onChange={(e) => setPublisherName(e.target.value)}
              placeholder={t.publisherNamePlaceholder}
              className="border-pink-200 focus:border-pink-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-pink-900">{t.publishDate}</Label>
            <Input
              id="date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="border-pink-200 focus:border-pink-400"
              required
            />
          </div>

          <div className="space-y-4 border border-pink-200 rounded-lg p-4 bg-pink-50/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="locked"
                checked={isLocked}
                onCheckedChange={(checked) => setIsLocked(checked as boolean)}
              />
              <Label htmlFor="locked" className="text-pink-900 flex items-center gap-2 cursor-pointer">
                <Lock className="h-4 w-4" />
                {t.lockAlbum}
              </Label>
            </div>
            
            {isLocked && (
              <div className="space-y-3 pl-6 border-l-2 border-pink-300">
                <p className="text-pink-700">{t.lockAlbumDesc}</p>
                <div>
                  <Label htmlFor="password" className="text-pink-900">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.enterPassword}
                    className="border-pink-200 focus:border-pink-400"
                    required={isLocked}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-pink-900">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="border-pink-200 focus:border-pink-400"
                    required={isLocked}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-pink-900 mb-2 block">{t.albumCover}</Label>
            {customCover ? (
              <div className="relative w-full aspect-[4/3] bg-pink-100 rounded-lg overflow-hidden">
                <img src={customCover} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCustomCover('')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center bg-pink-50/50 hover:bg-pink-100/50 transition-colors">
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleUploadCover}
                  className="hidden"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-pink-400 mx-auto mb-2" />
                  <p className="text-pink-900">{t.uploadCustomCover}</p>
                  <p className="text-pink-600">{t.firstItemCover}</p>
                </label>
              </div>
            )}
          </div>

          <div>
            <Label className="text-pink-900 mb-2 block">{t.photosAndVideos}</Label>
            <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center bg-pink-50/50 hover:bg-pink-100/50 transition-colors">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-pink-400 mx-auto mb-3" />
                <p className="text-pink-900 mb-1">{t.uploadPhotosVideos}</p>
                <p className="text-pink-600">{t.uploadPhotosVideosDesc}</p>
              </label>
            </div>
          </div>

          {isProcessing && (
            <div className="text-center text-pink-600">
              {t.processingFiles}
            </div>
          )}

          {media.length > 0 && (
            <div>
              <Label className="text-pink-900 mb-3 block">
                {t.albumMedia} ({media.length} {t.items})
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {media.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-square bg-pink-100 rounded-lg overflow-hidden">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={item.url}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(item.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-pink-800 truncate mt-1">{item.filename}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={isProcessing}
            >
              {t.createAlbum}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
