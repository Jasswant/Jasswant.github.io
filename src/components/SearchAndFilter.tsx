import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, SlidersHorizontal, X, Lock, Unlock, Grid3x3, List } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { getTranslation, type Language } from '../translations';
import { Album } from '../types';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'title' | 'date-newest' | 'date-oldest' | 'items';
  onSortChange: (sort: 'title' | 'date-newest' | 'date-oldest' | 'items') => void;
  filterLocked: 'all' | 'locked' | 'unlocked';
  onFilterLockedChange: (filter: 'all' | 'locked' | 'unlocked') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  language: Language;
  albums: Album[];
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterLocked,
  onFilterLockedChange,
  viewMode,
  onViewModeChange,
  language,
  albums,
}: SearchAndFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  const hasActiveFilters = filterLocked !== 'all' || sortBy !== 'date-newest';

  const suggestions = searchQuery.trim() === '' 
    ? [] 
    : albums.filter(album => 
        album.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pink-400" />
        <Input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-9 pr-9 border-pink-200 focus:border-pink-400 bg-white h-10"
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((album) => (
              <div
                key={album.id}
                className="px-4 py-2 hover:bg-pink-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2"
                onClick={() => {
                  onSearchChange(album.title);
                  setShowSuggestions(false);
                }}
              >
                <Search className="h-3 w-3 text-pink-300" />
                <span>{album.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-10 px-4 border-pink-200 hover:bg-pink-50 ${
                hasActiveFilters ? 'bg-pink-50 border-pink-400 text-pink-700' : 'bg-white text-gray-600'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t.filters}
              {hasActiveFilters && (
                <span className="ml-2 bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  !
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white border-pink-200 shadow-lg rounded-lg" align="end">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">{t.sortBy}</Label>
                <Select value={sortBy} onValueChange={(value: any) => onSortChange(value)}>
                  <SelectTrigger className="w-full border-pink-200 focus:border-pink-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-newest">{t.sortDateNewest}</SelectItem>
                    <SelectItem value="date-oldest">{t.sortDateOldest}</SelectItem>
                    <SelectItem value="title">{t.sortTitle}</SelectItem>
                    <SelectItem value="items">{t.sortItems}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">{t.filterBy}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={filterLocked === 'all' ? 'default' : 'outline'}
                    onClick={() => onFilterLockedChange('all')}
                    className={`h-8 ${
                      filterLocked === 'all'
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'border-pink-200 hover:bg-pink-50 text-gray-600'
                    }`}
                  >
                    {t.all}
                  </Button>
                  <Button
                    variant={filterLocked === 'locked' ? 'default' : 'outline'}
                    onClick={() => onFilterLockedChange('locked')}
                    className={`h-8 ${
                      filterLocked === 'locked'
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'border-pink-200 hover:bg-pink-50 text-gray-600'
                    }`}
                  >
                    <Lock className="h-3 w-3 mr-2" />
                    {t.locked}
                  </Button>
                  <Button
                    variant={filterLocked === 'unlocked' ? 'default' : 'outline'}
                    onClick={() => onFilterLockedChange('unlocked')}
                    className={`h-8 ${
                      filterLocked === 'unlocked'
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'border-pink-200 hover:bg-pink-50 text-gray-600'
                    }`}
                  >
                    <Unlock className="h-3 w-3 mr-2" />
                    {t.unlocked}
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onSortChange('date-newest');
                    onFilterLockedChange('all');
                  }}
                  className="w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50 h-8"
                >
                  {t.clearFilters}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="bg-white rounded-md border border-pink-200 p-1 flex h-10 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`h-8 w-8 p-0 rounded-sm ${
              viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`h-8 w-8 p-0 rounded-sm ${
              viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
