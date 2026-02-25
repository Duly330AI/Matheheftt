import { useState, useEffect } from 'react';
import { Profile, TaskType } from '../types';

const STORAGE_KEY = 'math_notebook_profiles';
const ACTIVE_PROFILE_KEY = 'math_notebook_active_profile_id';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  useEffect(() => {
    const storedProfiles = localStorage.getItem(STORAGE_KEY);
    if (storedProfiles) {
      setProfiles(JSON.parse(storedProfiles));
    }
    const storedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (storedActiveId) {
      setActiveProfileId(storedActiveId);
    }
  }, []);

  const saveProfiles = (newProfiles: Profile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
  };

  const createProfile = (name: string, avatar: string = 'cat') => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      avatar,
      totalScore: 0,
      scores: {},
      highscores: {}
    };
    const newProfiles = [...profiles, newProfile];
    saveProfiles(newProfiles);
    selectProfile(newProfile.id);
  };

  const selectProfile = (id: string | null) => {
    setActiveProfileId(id);
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  };

  const updateScore = (points: number, category: string) => {
    if (!activeProfileId) return;

    const newProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        const newHighscores = { ...p.highscores };
        const currentHighscore = Math.max(...(newHighscores[category] || [0]));
        const isNewHighscore = points > currentHighscore;
        
        // Keep top 5 scores
        const scores = [...(newHighscores[category] || []), points]
          .sort((a, b) => b - a)
          .slice(0, 5);
        newHighscores[category] = scores;

        const newScores = { ...p.scores };
        newScores[category] = (newScores[category] || 0) + points;

        return {
          ...p,
          totalScore: p.totalScore + points,
          scores: newScores,
          highscores: newHighscores
        };
      }
      return p;
    });
    saveProfiles(newProfiles);
    return points > (profiles.find(p => p.id === activeProfileId)?.highscores[category]?.[0] || 0);
  };

  const deleteProfile = (id: string) => {
    if (confirm('Möchtest du dieses Profil wirklich löschen? Alle Fortschritte gehen verloren.')) {
      const newProfiles = profiles.filter(p => p.id !== id);
      saveProfiles(newProfiles);
      if (activeProfileId === id) {
        selectProfile(null);
      }
    }
  };

  const updateProfile = (id: string, name: string, avatar: string) => {
    const newProfiles = profiles.map(p => {
      if (p.id === id) {
        return { ...p, name, avatar };
      }
      return p;
    });
    saveProfiles(newProfiles);
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  return {
    profiles,
    activeProfile,
    createProfile,
    selectProfile,
    updateScore,
    deleteProfile,
    updateProfile
  };
}
