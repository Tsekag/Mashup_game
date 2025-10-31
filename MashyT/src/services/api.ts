// api.ts — Unified client for backend endpoints
const API_BASE_URL = 'http://localhost:3001/api';

interface Genre {
  id: string;
  name: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  genre: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  genres: Genre[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  // ---------------- Auth ----------------
  async register(userData: { username: string; email: string; password: string }) {
    const response = await this.request<{ token: string; user: UserProfile }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/profile');
  }

  async updateGenres(genres: string[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/genres', {
      method: 'PUT',
      body: JSON.stringify({ genres }),
    });
  }

  // ---------------- Genres ----------------
  async getGenres(): Promise<Genre[]> {
    return this.request<Genre[]>('/genres');
  }

  // ---------------- Characters ----------------
  async getCharactersByGenre(genreId: string): Promise<Character[]> {
    return this.request<Character[]>(`/characters?genre_id=${genreId}`);
  }

  async getCharactersByGenres(genres: string[]): Promise<Character[]> {
    const results = await Promise.all(genres.map((id) => this.getCharactersByGenre(id)));
    return results.flat();
  }

  // ---------------- Uploads ----------------
  async uploadArtwork(formData: FormData) {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseURL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getGallery(): Promise<{ uploads: any[] }> {
  return this.request<{ uploads: any[] }>('/uploads');
}

async getUserUploads(userId: string): Promise<{ uploads: any[] }> {
  return this.request<{ uploads: any[] }>(`/uploads/user/${userId}`);
}

async getUserStats(userId: string): Promise<{ totalUploads: number; totalLikes: number; favoriteGenre: string }> {
  return this.request<{ totalUploads: number; totalLikes: number; favoriteGenre: string }>(
    `/uploads/stats/${userId}`
  );
}

  // ---------------- Feedback ----------------
  async toggleLike(uploadId: string) {
    return this.request(`/uploads/${uploadId}/like`, { method: 'POST' });
  }

  async addComment(uploadId: string, commentText: string) {
    return this.request('/feedback/comment', {
      method: 'POST',
      body: JSON.stringify({ uploadId, commentText }),
    });
  }

  async getComments(uploadId: string) {
    return this.request(`/feedback/comments/${uploadId}`);
  }
}

// Singleton instance
const api = new ApiClient(API_BASE_URL);

// ---------------- API Slices ----------------
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.register(userData),
  login: (credentials: { email: string; password: string }) => api.login(credentials),
  getProfile: () => api.getProfile(),
  updateGenres: (genres: string[]) => api.updateGenres(genres),
  setToken: (token: string | null) => api.setToken(token),
};

export const genreAPI = {
  getAll: () => api.getGenres(),
};

export const characterAPI = {
  getByGenre: (genreId: string) => api.getCharactersByGenre(genreId),
  getByGenres: (genres: string[]) => api.getCharactersByGenres(genres),
};

export const uploadAPI = {
  upload: (formData: FormData) => api.uploadArtwork(formData),
  getGallery: () => api.getGallery(),
  getUserUploads: (userId: string) => api.getUserUploads(userId),
  getUserStats: (userId: string) => api.getUserStats(userId),
};

export const feedbackAPI = {
  toggleLike: (uploadId: string) => api.toggleLike(uploadId),
  addComment: (uploadId: string, commentText: string) => api.addComment(uploadId, commentText),
  getComments: (uploadId: string) => api.getComments(uploadId),
};

export default api;
