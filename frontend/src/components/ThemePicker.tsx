'use client';
import React, { useState } from 'react';

export interface ThemePickerProps {
  selected: string;
  onSelect(theme: string): void;
}

const themes = [
  { label: 'Space Pirates', emoji: '🏴‍☠️', color: 'from-purple-500 to-indigo-600' },
  { label: 'Dinosaur Detectives', emoji: '🦕', color: 'from-green-500 to-emerald-600' },
  { label: 'Jungle Explorers', emoji: '🌴', color: 'from-green-400 to-teal-500' },
  { label: 'Robot Helpers', emoji: '🤖', color: 'from-gray-500 to-blue-600' },
  { label: 'Ocean Adventurers', emoji: '🌊', color: 'from-blue-400 to-cyan-600' },
  { label: 'Fairy Garden', emoji: '🧚', color: 'from-pink-400 to-rose-500' },
  { label: 'Medieval Knights', emoji: '⚔️', color: 'from-yellow-600 to-orange-600' },
  { label: 'Magic School', emoji: '🪄', color: 'from-purple-600 to-pink-600' },
];

export function ThemePicker({ selected, onSelect }: ThemePickerProps) {
  const [customTheme, setCustomTheme] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomThemeSubmit = () => {
    if (customTheme.trim()) {
      onSelect(customTheme.trim());
      setShowCustomInput(false);
      setCustomTheme('');
    }
  };

  const isCustomTheme = !themes.some(t => t.label === selected);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Choose a Fun Theme
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4" role="list">
        {themes.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onSelect(t.label)}
            aria-pressed={selected === t.label}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
              selected === t.label 
                ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg` 
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl" aria-hidden>{t.emoji}</span>
              <span className="text-sm font-medium text-center leading-tight">{t.label}</span>
            </div>
            {selected === t.label && (
              <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
            )}
          </button>
        ))}
        
        {/* Custom Theme Button */}
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className={`relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
            isCustomTheme && !showCustomInput
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-lg'
              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 border-dashed'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <span className="text-2xl" aria-hidden>✨</span>
            <span className="text-sm font-medium text-center leading-tight">
              {isCustomTheme && !showCustomInput ? selected : 'Custom Theme'}
            </span>
          </div>
          {isCustomTheme && !showCustomInput && (
            <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-500 text-sm">✓</span>
            </div>
          )}
        </button>
      </div>

      {/* Custom Theme Input */}
      {showCustomInput && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">✨ Create Your Own Theme</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomThemeSubmit()}
              placeholder="e.g., Superhero Academy, Cooking Adventures, Sports Champions..."
              className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleCustomThemeSubmit}
              disabled={!customTheme.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              ✓ Use
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomTheme('');
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Be creative! Try themes like "Underwater Mysteries", "Space Rangers", or "Cooking Champions"
          </p>
        </div>
      )}
    </div>
  );
}
