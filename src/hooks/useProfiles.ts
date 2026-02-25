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

  const createProfile = (name: string) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      totalScore: 0,
      highscores: {
        'mixed': [],
        '+': [],
        '-': [],
        '*': [],
        ':': [],
        '1x1': []
      }
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

  const updateScore = (points: number, taskType: TaskType) => {
    if (!activeProfileId) return;

    const newProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        const newHighscores = { ...p.highscores };
        // Keep top 5 scores
        const scores = [...(newHighscores[taskType] || []), points]
          .sort((a, b) => b - a)
          .slice(0, 5);
        newHighscores[taskType] = scores;

        return {
          ...p,
          totalScore: p.totalScore + points,
          highscores: newHighscores
        };
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
    updateScore
  };
}
