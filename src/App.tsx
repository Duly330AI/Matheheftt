/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MathNotebook } from './components/MathNotebook';
import { ProfileSelector } from './components/ProfileSelector';
import { useProfiles } from './hooks/useProfiles';
import { Leaderboard } from './components/Leaderboard';

export default function App() {
  const { 
    profiles, 
    activeProfile, 
    createProfile, 
    selectProfile, 
    updateScore,
    deleteProfile,
    updateProfile
  } = useProfiles();

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!activeProfile) {
    return (
      <>
        <ProfileSelector 
          profiles={profiles} 
          createProfile={createProfile} 
          selectProfile={selectProfile}
          deleteProfile={deleteProfile}
          updateProfile={updateProfile}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
        {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      </>
    );
  }

  return (
    <>
      <MathNotebook 
        activeProfile={activeProfile} 
        updateScore={updateScore} 
        onLogout={() => selectProfile(null)} 
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </>
  );
}
