'use client';
import React from 'react';

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
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Choose a Fun Theme
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="list">
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
      </div>
    </div>
  );
}
