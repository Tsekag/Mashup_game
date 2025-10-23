import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadAPI } from '../services/api';
import { User, Calendar, Heart, Image, Trophy } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalLikes: 0,
    favoriteGenre: 'None'
  });

  const BACKEND_URL = 'http://localhost:3001';

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.warn('No logged-in user found.');
        return;
      }

      console.log('Fetching dashboard data for user:', user);

      setIsLoading(true);
      try {
        // Fetch user uploads
        const uploadsResponse = await uploadAPI.getUserUploads(user.id.toString());
        console.log('Raw uploads response:', uploadsResponse);

        // Handle different response shapes
        const uploadsData = uploadsResponse.uploads || uploadsResponse.data || [];

        // Fix image URLs to point to backend
        const uploadsWithFullUrls = uploadsData.map((upload: any) => ({
          ...upload,
          imageUrl: upload.imageUrl.startsWith('http') ? upload.imageUrl : `${BACKEND_URL}${upload.imageUrl}`
        }));

        console.log('Parsed uploads data with full URLs:', uploadsWithFullUrls);
        setUserUploads(uploadsWithFullUrls);

        // Fetch user stats
        const statsResponse = await uploadAPI.getUserStats(user.id.toString());
        console.log('Raw stats response:', statsResponse);

        setStats({
          totalUploads: statsResponse.totalUploads || 0,
          totalLikes: statsResponse.totalLikes || 0,
          favoriteGenre: statsResponse.favoriteGenre || 'None'
        });
      } catch (error: any) {
        console.error('Failed to load dashboard:', error.message || error);
        setUserUploads([]);
        setStats({ totalUploads: 0, totalLikes: 0, favoriteGenre: 'None' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* User Profile Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.username || 'User'}!
              </h1>
              <p className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member since {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-xl text-center">
              <Image className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalUploads}</div>
              <div className="text-blue-100">Artworks Created</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 rounded-xl text-center">
              <Heart className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalLikes}</div>
              <div className="text-red-100">Total Likes</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-center">
              <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.favoriteGenre}</div>
              <div className="text-yellow-100">Favorite Genre</div>
            </div>
          </div>
        </div>

        {/* User's Uploads */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Mashup Creations</h2>
          
          {userUploads.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-xl mb-4">No artworks yet!</p>
              <p className="text-gray-500">
                Create your first mashup by spinning the wheel and uploading your artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userUploads.map((upload, index) => (
                <div
                  key={upload.id || index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={upload.imageUrl || 'https://via.placeholder.com/300'}
                      alt={upload.title || 'Untitled'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2">{upload.title || 'Untitled'}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Heart className="w-4 h-4" />
                        <span>{upload.likes || 0} likes</span>
                      </div>
                      <div className="text-gray-400">
                        {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
