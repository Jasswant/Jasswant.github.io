import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { AlbumGrid } from './components/AlbumGrid';
import { AlbumListView } from './components/AlbumListView';
import { AlbumView } from './components/AlbumView';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { getTranslation } from './translations';
import { SearchAndFilter } from './components/SearchAndFilter';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Album, MediaItem } from './types';
import { api } from './services/api';
import { verifyPassword } from './utils/crypto';

const CreateAlbumModal = lazy(() => import('./components/CreateAlbumModal').then(module => ({ default: module.CreateAlbumModal })));
const EditAlbumModal = lazy(() => import('./components/EditAlbumModal').then(module => ({ default: module.EditAlbumModal })));
const PasswordPrompt = lazy(() => import('./components/PasswordPrompt').then(module => ({ default: module.PasswordPrompt })));

function App() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPath, setAlbumPath] = useState<Album[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [parentAlbumForCreate, setParentAlbumForCreate] = useState<Album | null>(null);
  const [unlockedAlbums, setUnlockedAlbums] = useState<Set<string>>(new Set());
  const [passwordPrompt, setPasswordPrompt] = useState<{
    album: Album;
    action: 'view' | 'edit' | 'delete';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'date-newest' | 'date-oldest' | 'items'>('date-newest');
  const [filterLocked, setFilterLocked] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [language, setLanguage] = useState<'en' | 'id'>('en');

  // Get translations
  const t = getTranslation(language);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage === 'en' || savedLanguage === 'id') {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  // Load albums from backend on mount
  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await api.getAlbums();
      setAlbums(data);
    } catch (error) {
      console.error('Failed to load albums:', error);
      setAlbums([]);
    }
  };

  const updateAlbumInTree = (albums: Album[], targetId: string, updater: (album: Album) => Album): Album[] => {
    return albums.map((album: Album) => {
      if (album.id === targetId) {
        return updater(album);
      }
      if (album.albums && album.albums.length > 0) {
        return {
          ...album,
          albums: updateAlbumInTree(album.albums, targetId, updater)
        };
      }
      return album;
    });
  };

  const deleteAlbumFromTree = (albums: Album[], targetId: string): Album[] => {
    return albums.filter((album: Album) => album.id !== targetId).map((album: Album) => {
      if (album.albums && album.albums.length > 0) {
        return {
          ...album,
          albums: deleteAlbumFromTree(album.albums, targetId)
        };
      }
      return album;
    });
  };

  const handleCreateAlbum = async (album: Album) => {
    try {
      // If nested, update parent album's albums array and PUT parent
      if (parentAlbumForCreate) {
        const parent = albums.find((a: Album) => a.id === parentAlbumForCreate.id);
        if (parent) {
          const updatedParent = {
            ...parent,
            albums: [album, ...(parent.albums || [])],
          };
          await api.updateAlbum(updatedParent);
        }
      } else {
        // Only include 'albums' if non-empty
        const albumToSend = { ...album };
        if (!albumToSend.albums || albumToSend.albums.length === 0) {
          delete albumToSend.albums;
        }
        await api.createAlbum(albumToSend);
      }
      // Refresh albums
      await loadAlbums();
      setIsCreateModalOpen(false);
      setParentAlbumForCreate(null);
    } catch (error) {
      console.error('Failed to create album:', error);
      toast.error(t.errorOccurred);
    }
  };

  const handleUpdateAlbum = async (updatedAlbum: Album) => {
    try {
      await api.updateAlbum(updatedAlbum);
      // Refresh albums
      const all = await api.getAlbums();
      setAlbums(all);
      // Update selected album if it's the one being edited
      if (selectedAlbum?.id === updatedAlbum.id) {
        setSelectedAlbum(updatedAlbum);
      }
      setAlbumPath(albumPath.map((a: Album) => a.id === updatedAlbum.id ? updatedAlbum : a));
      toast.success(t.albumUpdated, {
        description: `${t.albumUpdatedDesc} "${updatedAlbum.title}" ${t.haveBenSaved}`,
      });
      setEditingAlbum(null);
    } catch (error) {
      console.error('Failed to update album:', error);
      toast.error(t.errorOccurred);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    const albumToDelete = findAlbumById(albums, albumId);
    if (albumToDelete?.isLocked && !unlockedAlbums.has(albumId)) {
      setPasswordPrompt({ album: albumToDelete, action: 'delete' });
      return;
    }
    try {
      await api.deleteAlbum(albumId);
      // Refresh albums
      await loadAlbums();
      setSelectedAlbum(null);
      setAlbumPath([]);
      // Remove from unlocked set
      const newUnlocked = new Set(unlockedAlbums);
      newUnlocked.delete(albumId);
      setUnlockedAlbums(newUnlocked);
    } catch (error) {
      console.error('Failed to delete album:', error);
      toast.error(t.errorOccurred);
    }
  };

  const handleEditAlbum = (album: Album) => {
    if (album.isLocked && !unlockedAlbums.has(album.id)) {
      setPasswordPrompt({ album, action: 'edit' });
      return;
    }
    
    setEditingAlbum(album);
  };

  const handleDownloadAlbum = async (album: Album) => {
    if (!album.media || album.media.length === 0) {
      toast.error(t.noMediaToDownload, {
        description: t.emptyAlbumToast,
      });
      return;
    }

    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // Use File System Access API to download as folder
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });

        toast.success(t.downloading, {
          description: `${t.savingItems} ${album.media.length} ${t.itemsToFolder}`,
        });

        let successCount = 0;
        let errorCount = 0;

        for (const media of album.media) {
          try {
            // Fetch the media data
            const response = await fetch(media.url);
            const blob = await response.blob();
            
            // Create file in the directory
            const fileHandle = await dirHandle.getFileHandle(media.filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            successCount++;
          } catch (err) {
            console.error('Error downloading file:', media.filename, err);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(t.downloadComplete, {
            description: `${t.successfullySaved} ${successCount} ${t.items}${errorCount > 0 ? ` (${errorCount} ${t.failed})` : ''}`,
          });
        } else {
          toast.error(t.downloadFailed, {
            description: t.couldNotSaveFiles,
          });
        }
      } else {
        // Fallback: Download files individually
        toast.info(t.downloadingIndividually, {
          description: t.browserNotSupport,
        });
        
        album.media.forEach((media, index) => {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = media.url;
            link.download = media.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 200);
        });

        setTimeout(() => {
          toast.success(t.downloadStarted, {
            description: `${t.downloading} ${album.media.length} ${t.items}`,
          });
        }, 500);
      }
    } catch (err: any) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        toast.error(t.downloadFailed, {
          description: t.couldNotAccessFolder,
        });
      }
    }
  };

  const findAlbumById = (albumList: Album[], id: string): Album | null => {
    for (const album of albumList) {
      if (album.id === id) return album;
      if (album.albums) {
        const found = findAlbumById(album.albums, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAlbumClick = (album: Album) => {
    if (album.isLocked && !unlockedAlbums.has(album.id)) {
      // Album is locked, need password
      setPasswordPrompt({ album, action: 'view' });
      return;
    }
    
    setAlbumPath([...albumPath, album]);
    setSelectedAlbum(album);
  };



  const handleBackToAlbums = () => {
    if (albumPath.length > 1) {
      // Go back to parent album
      const newPath = [...albumPath];
      newPath.pop();
      setAlbumPath(newPath);
      setSelectedAlbum(newPath[newPath.length - 1]);
    } else {
      // Go back to root
      setSelectedAlbum(null);
      setAlbumPath([]);
    }
  };

  const handleCreateNestedAlbum = () => {
    setParentAlbumForCreate(selectedAlbum);
    setIsCreateModalOpen(true);
  };

  const handleAddPhotos = (album: Album) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      const newMedia: MediaItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { url } = await api.uploadFile(file);
          const type = file.type.startsWith('image/') ? 'image' : 'video';
          
          newMedia.push({
            id: `${Date.now()}-${i}`,
            url,
            type,
            filename: file.name,
          });
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          toast.error(`${t.errorOccurred} ${file.name}`);
        }
      }
      
      if (newMedia.length > 0) {
        // Update the album with new media
        const updatedAlbums = updateAlbumInTree(albums, album.id, (a) => ({
          ...a,
          media: [...a.media, ...newMedia],
        }));
        setAlbums(updatedAlbums);
        // Update selected album if it's the one being updated
        if (selectedAlbum?.id === album.id) {
          const updated = findAlbumById(updatedAlbums, album.id);
          if (updated) setSelectedAlbum(updated);
        }
        
        // Persist changes to backend
        const updatedAlbum = findAlbumById(updatedAlbums, album.id);
        if (updatedAlbum) {
          await api.updateAlbum(updatedAlbum);
        }

        toast.success(`${t.addMedia}`, {
          description: `${t.successfullySaved} ${newMedia.length} ${t.items}`,
        });
      }
    };
    input.click();
  };

  const handleBreadcrumbClick = (albumId: string) => {
    if (albumId === '') {
      setSelectedAlbum(null);
      setAlbumPath([]);
    } else {
      const index = albumPath.findIndex((a: Album) => a.id === albumId);
      if (index !== -1) {
        const newPath = albumPath.slice(0, index + 1);
        setAlbumPath(newPath);
        setSelectedAlbum(newPath[newPath.length - 1]);
      }
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordPrompt) return;
    const isValid = await verifyPassword(password, passwordPrompt.album.passwordHash!);
    if (!isValid) {
      toast.error(t.incorrectPassword, { description: '' });
      return;
    }
    setUnlockedAlbums(new Set([...unlockedAlbums, passwordPrompt.album.id]));
    toast.success(t.albumUnlocked, {
      description: `${t.albumUnlockedDesc} "${passwordPrompt.album.title}"`,
    });
    // Perform the action
    if (passwordPrompt.action === 'view') {
      setAlbumPath([...albumPath, passwordPrompt.album]);
      setSelectedAlbum(passwordPrompt.album);
    } else if (passwordPrompt.action === 'edit') {
      setEditingAlbum(passwordPrompt.album);
    } else if (passwordPrompt.action === 'delete') {
      try {
        await api.deleteAlbum(passwordPrompt.album.id);
        await loadAlbums();
        setSelectedAlbum(null);
        setAlbumPath([]);
        toast.success(t.albumDeleted);
      } catch (error) {
        console.error('Failed to delete album:', error);
        toast.error(t.errorOccurred);
      }
    }
    setPasswordPrompt(null);
  };

  // Filter and sort albums
  const filteredAndSortedAlbums = useMemo(() => {
    const currentAlbums: Album[] = selectedAlbum?.albums || albums;
    // Filter by search query
    let filtered = currentAlbums.filter((album: Album) => {
      const matchesSearch =
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.publisherName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocked =
        filterLocked === 'all' ||
        (filterLocked === 'locked' && album.isLocked) ||
        (filterLocked === 'unlocked' && !album.isLocked);
      return matchesSearch && matchesLocked;
    });
    // Sort albums
    filtered.sort((a: Album, b: Album) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date-newest':
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        case 'date-oldest':
          return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
        case 'items':
          return b.media.length - a.media.length;
        default:
          return 0;
      }
    });
    return filtered;
  }, [albums, selectedAlbum, searchQuery, sortBy, filterLocked]);

  if (selectedAlbum) {
    return (
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedAlbum(null)}>
                <div className="bg-pink-500 p-1.5 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {t.appTitle}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
              </div>
            </div>
            <div className="pb-4">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterLocked={filterLocked}
                onFilterLockedChange={setFilterLocked}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                language={language}
                albums={selectedAlbum?.albums || albums}
              />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AlbumView 
            album={selectedAlbum} 
            albumPath={albumPath}
            onBack={handleBackToAlbums}
            onDelete={handleDeleteAlbum}
            onEdit={handleEditAlbum}
            onUpdate={handleUpdateAlbum}
            onAlbumClick={handleAlbumClick}
            onDeleteAlbum={handleDeleteAlbum}
            onEditAlbum={handleEditAlbum}
            onDownloadAlbum={handleDownloadAlbum}
            onAddPhotos={handleAddPhotos}
            onBreadcrumbClick={handleBreadcrumbClick}
            onCreateNestedAlbum={handleCreateNestedAlbum}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filterLocked={filterLocked}
            viewMode={viewMode}
            language={language}
          />
        </main>
        
        <Suspense fallback={null}>
          {isCreateModalOpen && (
            <CreateAlbumModal 
              isOpen={isCreateModalOpen}
              onClose={() => {
                setIsCreateModalOpen(false);
                setParentAlbumForCreate(null);
              }}
              onCreateAlbum={handleCreateAlbum}
              parentAlbum={parentAlbumForCreate}
              language={language}
            />
          )}

          {editingAlbum && (
            <EditAlbumModal
              isOpen={!!editingAlbum}
              album={editingAlbum}
              onClose={() => setEditingAlbum(null)}
              onUpdateAlbum={handleUpdateAlbum}
              language={language}
            />
          )}

          {passwordPrompt && (
            <PasswordPrompt
              isOpen={!!passwordPrompt}
              onClose={() => setPasswordPrompt(null)}
              onSubmit={handlePasswordSubmit}
              title={
                passwordPrompt.action === 'view'
                  ? `${t.unlock} "${passwordPrompt.album.title}"`
                  : passwordPrompt.action === 'edit'
                  ? `${t.edit} "${passwordPrompt.album.title}"`
                  : `${t.delete} "${passwordPrompt.album.title}"`
              }
              description={
                passwordPrompt.action === 'view'
                  ? t.enterPasswordToView
                  : passwordPrompt.action === 'edit'
                  ? t.enterPasswordToEdit
                  : t.enterPasswordToDelete
              }
              language={language}
            />
          )}
        </Suspense>
        
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-pink-500 p-1.5 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setParentAlbumForCreate(null);
                  setIsCreateModalOpen(true);
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white shadow-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.createAlbum}
              </Button>
              <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
            </div>
          </div>
          <div className="pb-4">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterLocked={filterLocked}
              onFilterLockedChange={setFilterLocked}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              language={language}
              albums={albums}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAndSortedAlbums.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-pink-300 max-w-md mx-auto">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-pink-900 mb-2">
                {searchQuery || filterLocked !== 'all' ? t.noAlbumsFound : t.noAlbumsYet}
              </h3>
              <p className="text-pink-600 mb-6">
                {searchQuery || filterLocked !== 'all'
                  ? t.noMatchingAlbums
                  : t.noAlbumsDesc}
              </p>
              {!searchQuery && filterLocked === 'all' && (
                <Button
                  onClick={() => {
                    setParentAlbumForCreate(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t.createAlbum}
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <AlbumGrid 
            albums={filteredAndSortedAlbums} 
            onAlbumClick={handleAlbumClick}
            onDeleteAlbum={handleDeleteAlbum}
            onEditAlbum={handleEditAlbum}
            onDownloadAlbum={handleDownloadAlbum}
            language={language}
          />
        ) : (
          <AlbumListView
            albums={filteredAndSortedAlbums}
            onAlbumClick={handleAlbumClick}
            onContextMenu={(e, album) => {
              e.preventDefault();
            }}
            language={language}
          />
        )}
      </main>

      <Suspense fallback={null}>
        {isCreateModalOpen && (
          <CreateAlbumModal 
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setParentAlbumForCreate(null);
            }}
            onCreateAlbum={handleCreateAlbum}
            parentAlbum={parentAlbumForCreate}
            language={language}
          />
        )}

        {editingAlbum && (
          <EditAlbumModal
            isOpen={!!editingAlbum}
            album={editingAlbum}
            onClose={() => setEditingAlbum(null)}
            onUpdateAlbum={handleUpdateAlbum}
            language={language}
          />
        )}

        {passwordPrompt && (
          <PasswordPrompt
            isOpen={!!passwordPrompt}
            onClose={() => setPasswordPrompt(null)}
            onSubmit={handlePasswordSubmit}
            title={
              passwordPrompt.action === 'view'
                ? `${t.unlock} "${passwordPrompt.album.title}"`
                : passwordPrompt.action === 'edit'
                ? `${t.edit} "${passwordPrompt.album.title}"`
                : `${t.delete} "${passwordPrompt.album.title}"`
            }
            description={
              passwordPrompt.action === 'view'
                ? t.enterPasswordToView
                : passwordPrompt.action === 'edit'
                ? t.enterPasswordToEdit
                : t.enterPasswordToDelete
            }
            language={language}
          />
        )}
      </Suspense>
      
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
