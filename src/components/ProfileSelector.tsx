import React, { useState } from 'react';
import { Profile } from '../types';
import { User, Plus, Trophy } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: Profile[];
  createProfile: (name: string) => void;
  selectProfile: (id: string) => void;
}

export function ProfileSelector({ profiles, createProfile, selectProfile }: ProfileSelectorProps) {
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-stone-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Matheheft Digital</h1>
          <p className="text-stone-500">Wähle dein Profil um zu starten</p>
        </div>

        <div className="space-y-3 mb-8">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile.id)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-stone-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-stone-800">{profile.name}</div>
                  <div className="text-xs text-stone-500">Gesamtpunkte: {profile.totalScore}</div>
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-blue-500">
                <Trophy size={16} />
              </div>
            </button>
          ))}

          {profiles.length === 0 && !isCreating && (
            <div className="text-center py-8 text-stone-400 italic">
              Noch keine Profile vorhanden.
            </div>
          )}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="bg-stone-50 p-4 rounded-lg border border-stone-200">
            <label className="block text-sm font-medium text-stone-700 mb-2">Dein Name</label>
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="z.B. Max"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 rounded text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!newProfileName.trim()}
                className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Starten
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Neues Profil erstellen
          </button>
        )}
      </div>
    </div>
  );
}
