import { Album, MediaItem } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Download, Calendar, User, Trash2, Edit, Plus, Eye, Image, Video, FolderPlus, ChevronRight, Home } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ContextMenu } from './ContextMenu';
import { AlbumGrid } from './AlbumGrid';
import { AlbumListView } from './AlbumListView';
import { getTranslation, type Language } from '../translations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface AlbumViewProps {
  album: Album;
  albumPath: Album[];
  onBack: () => void;
  onDelete: (albumId: string) => void;
  onEdit: (album: Album) => void;
  onUpdate: (album: Album) => void;
  onAlbumClick: (album: Album) => void;
  onDeleteAlbum: (albumId: string) => void;
  onEditAlbum: (album: Album) => void;
  onDownloadAlbum: (album: Album) => void;
  onAddPhotos: (album: Album) => void;
  onBreadcrumbClick: (albumId: string) => void;
  onCreateNestedAlbum: () => void;
  searchQuery: string;
  sortBy: 'title' | 'date-newest' | 'date-oldest' | 'items';
  filterLocked: 'all' | 'locked' | 'unlocked';
  viewMode: 'grid' | 'list';
  language: Language;
}

export function AlbumView({ 
  album, 
  albumPath,
  onBack, 
  onDelete, 
  onEdit, 
  onUpdate,
  onAlbumClick,
  onDeleteAlbum,
  onEditAlbum,
  onDownloadAlbum,
  onAddPhotos,
  onBreadcrumbClick,
  onCreateNestedAlbum,
  searchQuery,
  sortBy,
  filterLocked,
  viewMode,
  language,
}: AlbumViewProps) {
  const t = getTranslation(language);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mediaIndex: number;
  } | null>(null);

  const hasNestedAlbums = album.albums && album.albums.length > 0;
  const hasMedia = album.media && album.media.length > 0;

  // Filter and sort nested albums
  const filteredAndSortedAlbums = useMemo(() => {
    if (!album.albums) return [];
    
    let filtered = album.albums;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.publisherName.toLowerCase().includes(query)
      );
    }

    // Apply locked filter
    if (filterLocked === 'locked') {
      filtered = filtered.filter(a => a.isLocked);
    } else if (filterLocked === 'unlocked') {
      filtered = filtered.filter(a => !a.isLocked);
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'date-newest':
        sorted.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
      case 'date-oldest':
        sorted.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
        break;
      case 'items':
        sorted.sort((a, b) => {
          const aCount = (a.media?.length || 0) + (a.albums?.length || 0);
          const bCount = (b.media?.length || 0) + (b.albums?.length || 0);
          return bCount - aCount;
        });
        break;
    }

    return sorted;
  }, [album.albums, searchQuery, sortBy, filterLocked]);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConfirm = () => {
    onDelete(album.id);
    setShowDeleteDialog(false);
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      mediaIndex: index,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteMedia = (index: number) => {
    const updatedMedia = album.media.filter((_, i) => i !== index);
    const updatedAlbum = {
      ...album,
      media: updatedMedia,
      coverImage: updatedMedia.length > 0 ? updatedMedia[0].url : (album.albums && album.albums.length > 0 ? album.albums[0].coverImage : ''),
    };
    onUpdate(updatedAlbum);
  };

  const handleAddPhotos = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const newMedia: MediaItem[] = [];

      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (isImage || isVideo) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });

          newMedia.push({
            id: `${Date.now()}-${Math.random()}`,
            type: isImage ? 'image' : 'video',
            url: dataUrl,
            filename: file.name,
          });
        }
      }

      if (newMedia.length > 0) {
        const updatedAlbum = {
          ...album,
          media: [...album.media, ...newMedia],
        };
        onUpdate(updatedAlbum);
      }
    };

    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-pink-700 mb-4 flex-wrap">
            <button 
              onClick={() => {
                // Go back to root
                while (albumPath.length > 0) {
                  onBack();
                }
              }}
              className="hover:text-pink-900 flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>
            {albumPath.map((pathAlbum, index) => (
              <div key={pathAlbum.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                {index === albumPath.length - 1 ? (
                  <span className="text-pink-900">{pathAlbum.title}</span>
                ) : (
                  <button 
                    onClick={() => {
                      // Go back to this specific album in path
                      const stepsBack = albumPath.length - index - 1;
                      for (let i = 0; i < stepsBack; i++) {
                        onBack();
                      }
                    }}
                    className="hover:text-pink-900"
                  >
                    {pathAlbum.title}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button 
              onClick={onBack}
              variant="ghost"
              className="text-pink-700 hover:text-pink-900 hover:bg-pink-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={onCreateNestedAlbum}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                {t.newAlbum}
              </Button>
              <Button
                onClick={handleAddPhotos}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.addPhotos}
              </Button>
              <Button
                onClick={() => onEdit(album)}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t.edit}
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.delete}
              </Button>
            </div>
          </div>
        </div>

        {/* Album Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 mb-8 shadow-lg border border-pink-200">
          <h1 className="text-pink-900 mb-4">{album.title}</h1>
          <div className="flex flex-wrap gap-6 text-pink-700">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <span>{t.publishedBy} {album.publisherName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{new Date(album.publishDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center">
              <span>
                {album.media.length} {album.media.length !== 1 ? t.mediaItemsPlural : t.mediaItems}
                {hasNestedAlbums && ` • ${album.albums!.length} ${album.albums!.length !== 1 ? t.albumsPlural : t.album}`}
              </span>
            </div>
          </div>
        </div>

        {/* Nested Albums Section */}
        {hasNestedAlbums && (
          <div className="mb-8">
            <h2 className="text-pink-900 mb-4">
              Albums {filteredAndSortedAlbums.length !== album.albums!.length && `(${filteredAndSortedAlbums.length} of ${album.albums!.length})`}
            </h2>
            {filteredAndSortedAlbums.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 border border-pink-200 max-w-md mx-auto">
                  <p className="text-pink-700">{t.noMatchingAlbums}</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <AlbumGrid
                albums={filteredAndSortedAlbums}
                onAlbumClick={onAlbumClick}
                onDeleteAlbum={onDeleteAlbum}
                onEditAlbum={onEditAlbum}
                onDownloadAlbum={onDownloadAlbum}
                language={language}
              />
            ) : (
              <AlbumListView
                albums={filteredAndSortedAlbums}
                onAlbumClick={onAlbumClick}
                onContextMenu={(e, album) => {
                  e.preventDefault();
                }}
                language={language}
              />
            )}
          </div>
        )}

        {/* Media Section */}
        {hasMedia && (
          <div>
            <h2 className="text-pink-900 mb-4">Photos & Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {album.media.map((media, index) => (
                <div 
                  key={media.id}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                  className="bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-pink-100 hover:border-pink-300 transition-all duration-300"
                >
                  <div 
                    className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-100 relative cursor-pointer"
                    onClick={() => setSelectedMedia(index)}
                  >
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={media.filename}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <video 
                        src={media.url}
                        className="w-full h-full object-cover"
                        controls={false}
                      />
                    )}
                    <div className="absolute top-3 right-3 bg-pink-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1">
                      {media.type === 'image' ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-pink-900 mb-2 truncate">{media.filename}</p>
                    <Button
                      onClick={() => handleDownload(media.url, media.filename)}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Original
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasMedia && !hasNestedAlbums && (
          <div className="text-center py-20">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-12 max-w-md mx-auto border border-pink-200">
              <h3 className="text-pink-900 mb-2">{t.emptyAlbum}</h3>
              <p className="text-pink-700 mb-6">{t.emptyAlbumDesc}</p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleAddPhotos}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addMedia}
                </Button>
                <Button 
                  onClick={onCreateNestedAlbum}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  {t.createAlbum}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox view */}
        {selectedMedia !== null && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <Button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 bg-pink-500 hover:bg-pink-600 text-white z-10"
            >
              Close
            </Button>
            <div className="max-w-7xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
              {album.media[selectedMedia].type === 'image' ? (
                <img 
                  src={album.media[selectedMedia].url}
                  alt={album.media[selectedMedia].filename}
                  className="max-w-full max-h-[90vh] object-contain"
                />
              ) : (
                <video 
                  src={album.media[selectedMedia].url}
                  className="max-w-full max-h-[90vh] object-contain"
                  controls
                  autoPlay
                />
              )}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center flex-wrap">
                {selectedMedia > 0 && (
                  <Button
                    onClick={() => setSelectedMedia(selectedMedia - 1)}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {t.previous}
                  </Button>
                )}
                <Button
                  onClick={() => handleDownload(album.media[selectedMedia].url, album.media[selectedMedia].filename)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t.download}
                </Button>
                {selectedMedia < album.media.length - 1 && (
                  <Button
                    onClick={() => setSelectedMedia(selectedMedia + 1)}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {t.next}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.deleteAlbumConfirm} "{album.title}" {t.deleteAlbumMedia}{hasNestedAlbums ? ` ${t.deleteNestedAlbums}` : ''}. {t.cannotUndo}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600"
              >
                {t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  setSelectedMedia(contextMenu.mediaIndex);
                  handleCloseContextMenu();
                },
              },
              {
                label: t.download,
                icon: Download,
                onClick: () => {
                  const media = album.media[contextMenu.mediaIndex];
                  handleDownload(media.url, media.filename);
                  handleCloseContextMenu();
                },
              },
              {
                label: t.delete,
                icon: Trash2,
                onClick: () => {
                  if (confirm(t.deleteMediaConfirm)) {
                    handleDeleteMedia(contextMenu.mediaIndex);
                  }
                  handleCloseContextMenu();
                },
                danger: true,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
