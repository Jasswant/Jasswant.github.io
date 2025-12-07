import * as React from 'react';
import { Album } from '../types';
import { Calendar, User, Eye, Edit, Download, Trash2, Lock } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import { getTranslation, type Language } from '../translations';

interface AlbumGridProps {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
  onDeleteAlbum: (albumId: string) => void;
  onEditAlbum: (album: Album) => void;
  onDownloadAlbum: (album: Album) => void;
  language: Language;
}

export function AlbumGrid({ albums, onAlbumClick, onDeleteAlbum, onEditAlbum, onDownloadAlbum, language }: AlbumGridProps) {
  const t = getTranslation(language);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; album: Album } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, album: Album) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      album,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => onAlbumClick(album)}
            onContextMenu={(e) => handleContextMenu(e, album)}
            className="bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-pink-100 hover:border-pink-400 hover:-translate-y-2 group animate-fade-in"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-100 relative overflow-hidden">
              {album.coverImage ? (
                <img 
                  src={album.coverImage} 
                  alt={album.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-300">
                  <Calendar className="h-16 w-16" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                {album.isLocked && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>{t.lockedOnly}</span>
                  </div>
                )}
                <div className="bg-pink-500 text-white px-3 py-1 rounded-full">
                  {album.media.length} {t.items}
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-pink-900 mb-2 group-hover:text-pink-600 transition-colors">{album.title}</h3>
              <div className="flex items-center text-pink-600 mb-1">
                <User className="h-4 w-4 mr-2" />
                <span>{album.publisherName}</span>
              </div>
              <div className="flex items-center text-pink-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(album.publishDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          options={[
            {
              label: t.preview,
              icon: Eye,
              onClick: () => {
                onAlbumClick(contextMenu.album);
                handleCloseContextMenu();
              },
            },
            {
              label: t.edit,
              icon: Edit,
              onClick: () => {
                onEditAlbum(contextMenu.album);
                handleCloseContextMenu();
              },
            },
            {
              label: t.downloadAll,
              icon: Download,
              onClick: () => {
                onDownloadAlbum(contextMenu.album);
                handleCloseContextMenu();
              },
            },
            {
              label: t.delete,
              icon: Trash2,
              onClick: () => {
                if (confirm(`${t.areYouSure} "${contextMenu.album.title}"?`)) {
                  onDeleteAlbum(contextMenu.album.id);
                }
                handleCloseContextMenu();
              },
              danger: true,
            },
          ]}
        />
      )}
    </>
  );
}
