import { Album } from '../types';
import { Calendar, User, Lock, Image, Play } from 'lucide-react';
import { getTranslation, type Language } from '../translations';

interface AlbumListViewProps {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
  onContextMenu: (e: React.MouseEvent, album: Album) => void;
  language: Language;
}

export function AlbumListView({ albums, onAlbumClick, onContextMenu, language }: AlbumListViewProps) {
  const t = getTranslation(language);
  const getMediaCounts = (album: Album) => {
    const images = album.media.filter((m) => m.type === 'image').length;
    const videos = album.media.filter((m) => m.type === 'video').length;
    return { images, videos };
  };

  return (
    <div className="space-y-2">
      {albums.map((album) => {
        const { images, videos } = getMediaCounts(album);
        return (
          <div
            key={album.id}
            onClick={() => onAlbumClick(album)}
            onContextMenu={(e) => onContextMenu(e, album)}
            className="bg-white rounded-lg border border-pink-200 p-4 hover:shadow-lg hover:border-pink-400 transition-all duration-300 cursor-pointer group animate-fade-in"
          >
            <div className="flex gap-4 items-center">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-pink-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-pink-900 group-hover:text-pink-600 transition-colors truncate">
                    {album.title}
                  </h3>
                  {album.isLocked && (
                    <div className="flex-shrink-0 bg-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-pink-600/70">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="truncate">{album.publisherName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(album.publishDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  {images > 0 && (
                    <div className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-full">
                      <Image className="h-3 w-3 text-pink-600" />
                      <span className="text-pink-700">{images}</span>
                    </div>
                  )}
                  {videos > 0 && (
                    <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full">
                      <Play className="h-3 w-3 text-purple-600" />
                      <span className="text-purple-700">{videos}</span>
                    </div>
                  )}
                  {(album.albums?.length ?? 0) > 0 && (
                    <div className="bg-pink-500 text-white px-2 py-1 rounded-full">
                      {album.albums!.length} {album.albums!.length === 1 ? t.album : t.albumsPlural}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
