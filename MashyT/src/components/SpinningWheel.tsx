import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import type { Character } from '../contexts/GameContext';
import { characterAPI } from '../services/api';   // ✅ use API client

interface SpinningWheelProps {
  onNavigateToCards: () => void;
}

export function SpinningWheel({ onNavigateToCards }: SpinningWheelProps) {
  const { selectedGenres, setSpinResult } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showNavigateButton, setShowNavigateButton] = useState(false);

  const [characters, setCharacters] = useState<Character[]>([]);

  const wheelRef = useRef<HTMLDivElement>(null);

  // 🔹 Fetch characters for selected genres via API client
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const promises = selectedGenres.map((genre) =>
          characterAPI.getByGenre(genre)
        );
        const results = await Promise.all(promises);

        // results = [Character[], Character[]...]
        const allCharacters = results.flat();
        setCharacters(allCharacters);
      } catch (err) {
        console.error('Error fetching characters:', err);
      }
    };

    if (selectedGenres.length > 0) {
      fetchCharacters();
    }
  }, [selectedGenres]);

  // 🔹 Spin logic
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);

    if (characters.length < 2) {
      alert('Not enough characters. Please select more genres.');
      setIsSpinning(false);
      return;
    }

    const shuffled = [...characters].sort(() => Math.random() - 0.5);
    let character1 = shuffled[0];
    let character2 = shuffled[1];
    if (character1.id === character2.id && shuffled.length > 2) {
      character2 = shuffled[2];
    }

    const result = { character1, character2, genres: selectedGenres };

    const finalRotation = rotation + 1800 + Math.random() * 720; // 5–7 spins
    setRotation(finalRotation);
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

    setTimeout(() => {
      setIsSpinning(false);
      setCurrentResult(result);
      setShowResult(true);
      setSpinResult(result);
      setTimeout(() => setShowNavigateButton(true), 500);
    }, 3000);
  };

  const handleViewCards = () => onNavigateToCards();

  // 🔹 No genres selected
  if (selectedGenres.length === 0) {
    return (
      <div className="spinner-page">
        <div className="spinner-card">
          <h2>⚠️ No Genres Selected</h2>
          <p>Please go back and select at least 3 genres to spin the wheel.</p>
          <button onClick={() => window.history.back()}>← Back to Genre Selection</button>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-page">
      <div className="spinner-container">
        <h1>🎰 Mashup Spinner</h1>
        <p>
          Spinning from your selected genres:{' '}
          {selectedGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
        </p>

        <div className="spinner-wrapper">
          <div ref={wheelRef} className="wheel">
            {selectedGenres.map((genre, index) => (
              <div
                key={genre}
                className="wheel-segment"
                style={{
                  transform: `rotate(${(360 / selectedGenres.length) * index}deg)`,
                }}
              >
                <span
                  style={{
                    transform: `rotate(${-(360 / selectedGenres.length) * index}deg)`,
                  }}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="wheel-pointer"></div>
        </div>

        {!showResult && (
          <button onClick={spinWheel} disabled={isSpinning}>
            {isSpinning ? '🌀 Spinning...' : '🎯 SPIN THE WHEEL!'}
          </button>
        )}

        {showResult && currentResult && (
          <div className="result-card">
            <h2>🎉 Your Epic Mashup!</h2>
            <div className="result-grid">
              <div className="result-item">
                <img src={currentResult.character1.image} alt={currentResult.character1.name} />
                <h3>{currentResult.character1.name}</h3>
                <p>{currentResult.character1.description}</p>
                <span>{currentResult.character1.genre}</span>
              </div>
              <div className="result-item">
                <img src={currentResult.character2.image} alt={currentResult.character2.name} />
                <h3>{currentResult.character2.name}</h3>
                <p>{currentResult.character2.description}</p>
                <span>{currentResult.character2.genre}</span>
              </div>
            </div>
            <div className="result-actions">
              <button onClick={spinWheel}>🔄 Spin Again</button>
              {showNavigateButton && (
                <button onClick={handleViewCards}>👀 View 3D Cards</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
