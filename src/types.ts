export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  filename: string;
}

export interface Album {
  id: string;
  title: string;
  publisherName: string;
  publishDate: string;
  coverImage: string;
  media: MediaItem[];
  albums?: Album[];
  isLocked?: boolean;
  passwordHash?: string;
  password?: string; // Optional, used for updates/creation but not always returned
}
