/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MathNotebook } from '@/components/MathNotebook';
import { ProfileSelector } from '@/components/ProfileSelector';
import { useProfiles } from '@/hooks/useProfiles';

export default function App() {
  const { profiles, activeProfile, createProfile, selectProfile, updateScore } = useProfiles();

  if (!activeProfile) {
    return (
      <ProfileSelector 
        profiles={profiles} 
        createProfile={createProfile} 
        selectProfile={selectProfile} 
      />
    );
  }

  return (
    <MathNotebook 
      activeProfile={activeProfile} 
      updateScore={updateScore} 
      onLogout={() => selectProfile(null)} 
    />
  );
}
