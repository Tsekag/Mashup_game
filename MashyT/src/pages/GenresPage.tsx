// src/pages/GenresPage.tsx

import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { genresApi } from '../services/adminApi';

interface Genre {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const GenresPage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [newGenreName, setNewGenreName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching genres data...');
      const response = await genresApi.getAll();
      console.log('📚 Genres response:', response);
      setGenres(response.genres);
      console.log('✅ Genres fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching genres:', err);
      setError('Failed to fetch genres: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    try {
      await genresApi.create(newGenreName.trim());
      setNewGenreName('');
      setShowAddModal(false);
      fetchGenres();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create genre');
    }
  };

  const handleEditGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenre || !newGenreName.trim()) return;

    try {
      await genresApi.update(editingGenre.id, newGenreName.trim(), editingGenre.is_active);
      setNewGenreName('');
      setEditingGenre(null);
      setShowEditModal(false);
      fetchGenres();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update genre');
    }
  };

  const handleDeleteGenre = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this genre?')) return;

    try {
      await genresApi.delete(id);
      fetchGenres();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete genre');
    }
  };

  const handleToggleGenre = async (id: number) => {
    try {
      await genresApi.toggle(id);
      fetchGenres();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle genre status');
    }
  };

  const openEditModal = (genre: Genre) => {
    setEditingGenre(genre);
    setNewGenreName(genre.name);
    setShowEditModal(true);
  };

  const filteredGenres = genres
    .filter(genre => 
      genre.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Debug Info */}
      <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-6">
        <p>Debug: Genres: {genres.length}, Loading: {loading.toString()}</p>
        <p>Error: {error || 'None'}</p>
        <p>Admin Token: {localStorage.getItem('adminToken') ? 'Present' : 'Missing'}</p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Genres Card */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-purple-400">GENRES</h2>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowUpDown size={16} />
            Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
          >
            <Plus size={16} />
            Add Genre
          </button>
        </div>

        {/* Genres Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredGenres.map((genre) => (
            <div key={genre.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg uppercase">
                  {genre.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(genre)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteGenre(genre.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {new Date(genre.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    {genre.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleGenre(genre.id)}
                    className="transition-colors"
                  >
                    {genre.is_active ? (
                      <ToggleRight size={20} className="text-purple-500" />
                    ) : (
                      <ToggleLeft size={20} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGenres.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No genres found matching your search.' : 'No genres available.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Genre Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New Genre</h3>
            <form onSubmit={handleAddGenre}>
              <input
                type="text"
                placeholder="Genre name"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors"
                >
                  Create Genre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewGenreName('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Genre Modal */}
      {showEditModal && editingGenre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Edit Genre</h3>
            <form onSubmit={handleEditGenre}>
              <input
                type="text"
                placeholder="Genre name"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors"
                >
                  Update Genre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGenre(null);
                    setNewGenreName('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

