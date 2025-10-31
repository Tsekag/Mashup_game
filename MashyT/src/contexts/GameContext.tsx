import { createContext, useContext, useState, ReactNode } from 'react';
import { uploadAPI, feedbackAPI } from '../services/api';

// -------------------- Interfaces --------------------
export interface Character {
  id: string;
  name: string;
  image: string;
  genre: string;
  description: string;
}

interface SpinResult {
  character1: Character;
  character2: Character;
  genres: string[];
}

interface CommunityPost {
  id: string;
  title: string;
  username: string;
  imageUrl: string;
  likes: number;
  isLiked: boolean;
  comments?: any[];
  createdAt: string;
}

interface UserUpload {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  createdAt: string;
}

interface UserStats {
  totalUploads: number;
  totalLikes: number;
  favoriteGenre: string;
}

interface GameContextType {
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;

  spinResult: SpinResult | null;
  setSpinResult: (result: SpinResult | null) => void;

  communityPosts: CommunityPost[];
  isLoadingPosts: boolean;
  loadCommunityPosts: () => Promise<void>;
  likeCommunityPost: (postId: string) => Promise<void>;
  uploadArtwork: (file: File, title: string, spinData?: SpinResult) => Promise<boolean>;

  loadUserUploads: (userId: string) => Promise<UserUpload[]>;
  getUserStats: (userId: string) => Promise<UserStats>;
}

// -------------------- Context --------------------
const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // -------------------- Community --------------------
  const loadCommunityPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = (await uploadAPI.getGallery()) as { uploads: any[] }; // ✅ typed
      const posts = response.uploads.map((upload: any) => ({
        id: upload.id.toString(),
        title: upload.title,
        username: upload.username,
        imageUrl: upload.imageUrl,
        likes: upload.likes,
        isLiked: upload.isLiked,
        createdAt: upload.createdAt,
      }));
      setCommunityPosts(posts);
    } catch (error) {
      console.error('Failed to load community posts:', error);
      setCommunityPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const likeCommunityPost = async (postId: string) => {
    const post = communityPosts.find((p) => p.id === postId);
    if (!post) return;

    const updatedPost = {
      ...post,
      isLiked: !post.isLiked,
      likes: post.isLiked ? post.likes - 1 : post.likes + 1,
    };

    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? updatedPost : p))
    );

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');

      await feedbackAPI.toggleLike(postId);
      window.dispatchEvent(new Event('dashboard-refresh'));
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
    }
  };

  const uploadArtwork = async (
    file: File,
    title: string,
    spinData?: SpinResult
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);

      if (spinData) {
        formData.append('character1', JSON.stringify(spinData.character1));
        formData.append('character2', JSON.stringify(spinData.character2));
        formData.append('genres', JSON.stringify(spinData.genres));
      }

      await uploadAPI.upload(formData); // ✅ fixed (no extra arg)
      await loadCommunityPosts();
      window.dispatchEvent(new Event('dashboard-refresh'));

      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      return false;
    }
  };

  // -------------------- Dashboard --------------------
  const loadUserUploads = async (userId: string): Promise<UserUpload[]> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');

      const res = (await uploadAPI.getUserUploads(userId)) as { uploads: UserUpload[] };
      return res.uploads || [];
    } catch (error) {
      console.error('Failed to load user uploads:', error);
      return [];
    }
  };

  const getUserStats = async (userId: string): Promise<UserStats> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');

      return (await uploadAPI.getUserStats(userId)) as UserStats;
    } catch (error) {
      console.error('Failed to load user stats:', error);
      return { totalUploads: 0, totalLikes: 0, favoriteGenre: 'None' };
    }
  };

  const value: GameContextType = {
    selectedGenres,
    setSelectedGenres,
    spinResult,
    setSpinResult,
    communityPosts,
    isLoadingPosts,
    loadCommunityPosts,
    likeCommunityPost,
    uploadArtwork,
    loadUserUploads,
    getUserStats,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
