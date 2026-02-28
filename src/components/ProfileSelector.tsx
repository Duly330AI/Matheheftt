import React, { useState } from 'react';
import { Profile } from '../types';
import { User, Plus, Trophy, Cat, Dog, Bird, Fish, Rabbit, Turtle, Trash2, Pencil, X, Check, LineChart } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: Profile[];
  createProfile: (name: string, avatar: string) => void;
  selectProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  updateProfile: (id: string, name: string, avatar: string) => void;
  onOpenLeaderboard: () => void;
  onOpenDashboard: () => void;
}

const AVATARS = [
  { id: 'cat', icon: Cat, label: 'Katze' },
  { id: 'dog', icon: Dog, label: 'Hund' },
  { id: 'rabbit', icon: Rabbit, label: 'Hase' },
  { id: 'bird', icon: Bird, label: 'Vogel' },
  { id: 'fish', icon: Fish, label: 'Fisch' },
  { id: 'turtle', icon: Turtle, label: 'Schildkröte' },
];

export function ProfileSelector({ profiles, createProfile, selectProfile, deleteProfile, updateProfile, onOpenLeaderboard, onOpenDashboard }: ProfileSelectorProps) {
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('cat');
  const [isCreating, setIsCreating] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim(), selectedAvatar);
    }
  };

  const startEditing = (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditAvatar(profile.avatar || 'cat');
    setDeleteConfirmId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditAvatar('');
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateProfile(id, editName.trim(), editAvatar);
      setEditingId(null);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setEditingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProfile(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const getAvatarIcon = (avatarId: string) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar ? avatar.icon : User;
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl border border-stone-200 relative">
        <button 
            onClick={onOpenLeaderboard}
            className="absolute top-6 right-6 text-yellow-500 hover:text-yellow-600 transition-colors p-2 rounded-full hover:bg-yellow-50 flex items-center gap-2"
            title="Bestenliste"
        >
            <Trophy size={24} />
            <span className="text-sm font-bold hidden sm:inline">Bestenliste</span>
        </button>
        <button 
            onClick={onOpenDashboard}
            className="absolute top-6 left-6 text-blue-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 flex items-center gap-2"
            title="Lehrer Dashboard"
        >
            <LineChart size={24} />
            <span className="text-sm font-bold hidden sm:inline">Lehrer</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Matheheft Digital</h1>
          <p className="text-stone-500">Wähle dein Profil um zu starten</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {profiles.map(profile => {
            if (deleteConfirmId === profile.id) {
              return (
                <div key={profile.id} className="bg-red-50 p-4 rounded-lg border-2 border-red-500 shadow-md flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-200 min-h-[120px]">
                  <div className="text-center">
                    <h3 className="text-red-700 font-bold text-lg mb-1">Profil löschen?</h3>
                    <p className="text-red-600 text-sm">Endgültig löschen?</p>
                  </div>
                  <div className="flex justify-center gap-3 w-full">
                      <button onClick={cancelDelete} className="flex-1 px-3 py-2 bg-white text-stone-600 rounded-lg border border-stone-200 hover:bg-stone-50 font-medium transition-colors text-sm">
                        Abbrechen
                      </button>
                      <button onClick={(e) => confirmDelete(profile.id, e)} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm text-sm">
                        Ja, weg damit
                      </button>
                  </div>
                </div>
              );
            }

            if (editingId === profile.id) {
              return (
                <div key={profile.id} className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-md flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {AVATARS.map(avatar => {
                      const Icon = avatar.icon;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setEditAvatar(avatar.id)}
                          className={`p-2 rounded-lg border transition-all ${
                            editAvatar === avatar.id 
                              ? 'bg-blue-50 border-blue-500 text-blue-600' 
                              : 'border-transparent hover:bg-stone-100 text-stone-400'
                          }`}
                        >
                          <Icon size={20} />
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(profile.id);
                        if (e.key === 'Escape') cancelEditing();
                    }}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={cancelEditing} className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors" title="Abbrechen">
                        <X size={20} />
                      </button>
                      <button onClick={() => saveEdit(profile.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Speichern">
                        <Check size={20} />
                      </button>
                  </div>
                </div>
              );
            }

            const Icon = getAvatarIcon(profile.avatar || 'cat');
            return (
              <div key={profile.id} className="relative group">
                <button
                  onClick={() => selectProfile(profile.id)}
                  className="w-full flex items-center p-4 rounded-lg border border-stone-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-blue-100 group-hover:text-blue-600 mr-4 shrink-0">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 text-lg mb-1">{profile.name}</div>
                    <div className="text-xs text-stone-500">Gesamtpunkte: {profile.totalScore}</div>
                  </div>
                </button>

                {/* Edit/Delete Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-stone-100">
                    <button 
                        onClick={(e) => startEditing(profile, e)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Bearbeiten"
                    >
                        <Pencil size={14} />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteClick(profile.id, e)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Löschen"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
              </div>
            );
          })}

          {profiles.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-8 text-stone-400 italic">
              Noch keine Profile vorhanden.
            </div>
          )}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="bg-stone-50 p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-700 mb-4">Neues Profil erstellen</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Dein Avatar</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {AVATARS.map(avatar => {
                  const Icon = avatar.icon;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                        selectedAvatar === avatar.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-transparent hover:bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Icon size={32} />
                      <span className="text-xs mt-1">{avatar.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">Dein Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Max"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
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
                Erstellen & Starten
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-4 rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium text-lg"
          >
            <Plus size={24} />
            Neues Profil erstellen
          </button>
        )}
      </div>
    </div>
  );
}
