import { Album } from '../types';

const API_BASE_URL = 'http://localhost:5000';

export const api = {
  getAlbums: async (): Promise<Album[]> => {
    const response = await fetch(`${API_BASE_URL}/albums`);
    if (!response.ok) throw new Error('Failed to fetch albums');
    return response.json();
  },

  getAlbum: async (id: string): Promise<Album> => {
    const response = await fetch(`${API_BASE_URL}/albums/${id}`);
    if (!response.ok) throw new Error('Failed to fetch album');
    return response.json();
  },

  createAlbum: async (album: Album): Promise<Album> => {
    const response = await fetch(`${API_BASE_URL}/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(album),
    });
    if (!response.ok) throw new Error('Failed to create album');
    return response.json();
  },

  updateAlbum: async (album: Album): Promise<Album> => {
    const response = await fetch(`${API_BASE_URL}/albums/${album.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(album),
    });
    if (!response.ok) throw new Error('Failed to update album');
    return response.json();
  },

  deleteAlbum: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete album');
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }
};
