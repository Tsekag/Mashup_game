import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Upload } from 'lucide-react';

export function CommunityGallery() {
  const { 
    communityPosts, 
    likeCommunityPost, 
    loadCommunityPosts, 
    isLoadingPosts,
    uploadArtwork
  } = useGame();
  const { user } = useAuth();

  const [filter, setFilter] = useState<'all' | 'liked' | 'recent'>('all');
  const [animatingLike, setAnimatingLike] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  useEffect(() => {
    if (animatingLike) {
      const timeout = setTimeout(() => setAnimatingLike(null), 600);
      return () => clearTimeout(timeout);
    }
  }, [animatingLike]);

  const handleLike = async (postId: string) => {
    setAnimatingLike(postId);
    await likeCommunityPost(postId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this upload?')) return;

    try {
      // Use GameContext method if implemented, otherwise direct API call
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/uploads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Delete failed');
      }
      await loadCommunityPosts();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete upload');
    }
  };

  const filteredPosts = communityPosts.filter(post => {
    switch (filter) {
      case 'liked': return post.isLiked;
      case 'recent':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(post.createdAt) > oneDayAgo;
      default: return true;
    }
  });

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle) {
      setUploadError('Please provide both title and image');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const success = await uploadArtwork(selectedFile, uploadTitle);
      if (success) {
        setShowUploadModal(false);
        setUploadTitle('');
        setSelectedFile(null);
        await loadCommunityPosts();
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🎨 Community Gallery</h1>
          <p className="text-xl text-gray-300 mb-8">
            Share your mashup creations and discover amazing artwork from the community!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto mb-8"
          >
            <Upload className="w-5 h-5" />
            Upload New Artwork
          </button>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {['all', 'liked', 'recent'].map((id) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`
                px-6 py-2 rounded-full font-semibold transition-all duration-200
                ${filter === id
                  ? 'bg-white text-purple-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
                }
              `}
            >
              {id === 'all' ? 'All Posts' : id === 'liked' ? 'Liked' : 'Recent'}
            </button>
          ))}
        </div>

        {isLoadingPosts ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading community posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-white text-xl mb-4">No posts found</p>
            <p className="text-gray-400">Be the first to share your mashup artwork!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={`http://localhost:3001${post.imageUrl}`}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1374645/pexels-photo-1374645.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">by {post.username}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                          ${post.isLiked ? 'bg-red-500 text-white' : 'bg-white/20 text-gray-300 hover:bg-white/30'}
                          ${animatingLike === post.id ? 'animate-pulse scale-110' : ''}
                        `}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      {(user && (user.id === post.userId || user.role === 'admin')) && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          type="button"
                          title="Delete upload"
                          className="ml-2 text-red-400 hover:text-red-600 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6">Upload Your Mashup</h3>
              <p className="text-gray-600 mb-6">Share your creative interpretation with the community!</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter a title for your artwork..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {uploadError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {uploadError}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadTitle || !selectedFile}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload Artwork'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityGallery;
