import React, { useState, useEffect, useMemo } from 'react';
import { ProfileSelector } from './components/ProfileSelector';
import { StartScreen } from './components/StartScreen';
import { MathSessionScreen } from './components/MathSessionScreen';
import { SessionSummary } from './components/SessionSummary';
import { Dashboard } from './dashboard/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { StudentModel } from './student/StudentModel';
import { Profile, TaskType, Difficulty, GameMode, SessionState } from './types';
import { SnapshotBuilder } from './analytics/SnapshotBuilder';
import { KPICalculator } from './analytics/KPICalculator';
import { CognitiveLoadState } from './cognitive/types';

type Screen = 'PROFILE' | 'START' | 'SESSION' | 'SUMMARY' | 'DASHBOARD' | 'LEADERBOARD';

function App() {
  // --- State ---
  const [currentScreen, setCurrentScreen] = useState<Screen>('PROFILE');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Session Config
  const [sessionConfig, setSessionConfig] = useState<{
    taskType: TaskType;
    selectedTable: number | null;
    difficulty: Difficulty;
    gameMode: GameMode;
    timeLimit?: number;
  }>({
    taskType: 'mixed',
    selectedTable: null,
    difficulty: 'medium',
    gameMode: 'classic'
  });

  // Session Result
  const [lastSessionState, setLastSessionState] = useState<SessionState | null>(null);

  // Student Model (Persisted)
  const studentModel = useMemo(() => {
    if (!activeProfile) return new StudentModel();
    const saved = localStorage.getItem(`mathTrainer.studentModel.${activeProfile.id}`);
    return saved ? StudentModel.deserialize(saved) : new StudentModel();
  }, [activeProfile?.id]);

  const [dashboardProfileId, setDashboardProfileId] = useState<string | null>(null);

  const dashboardProfile = useMemo(() => {
    return profiles.find(p => p.id === dashboardProfileId) || activeProfile || profiles[0] || null;
  }, [profiles, dashboardProfileId, activeProfile]);

  const dashboardStudentModel = useMemo(() => {
    if (!dashboardProfile) return new StudentModel();
    const saved = localStorage.getItem(`mathTrainer.studentModel.${dashboardProfile.id}`);
    return saved ? StudentModel.deserialize(saved) : new StudentModel();
  }, [dashboardProfile?.id]);

  // --- Effects ---
  useEffect(() => {
    const savedProfiles = localStorage.getItem('mathTrainer.profiles');
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        // Sanitize loaded profiles to ensure all properties exist
        const sanitized = Array.isArray(parsed) ? parsed.map((p: any) => ({
            ...p,
            scores: p.scores || {},
            highscores: p.highscores || {},
            history: p.history || [],
            telemetryHistory: p.telemetryHistory || [],
            cognitiveTimeline: p.cognitiveTimeline || [],
            plannerDecisions: p.plannerDecisions || []
        })) : [];
        setProfiles(sanitized);
      } catch (e) {
        console.error('Failed to parse profiles', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mathTrainer.profiles', JSON.stringify(profiles));
    }
  }, [profiles, isLoaded]);

  // --- Handlers ---

  const handleCreateProfile = (name: string, avatar: string) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      avatar,
      totalScore: 0,
      history: [],
      scores: {},
      highscores: {},
      telemetryHistory: [],
      cognitiveTimeline: [],
      plannerDecisions: []
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfile(newProfile);
    setCurrentScreen('START');
  };

  const handleSelectProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setActiveProfile(profile);
      setCurrentScreen('START');
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfile?.id === id) {
      setActiveProfile(null);
    }
  };

  const handleUpdateProfile = (id: string, name: string, avatar: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name, avatar } : p));
    if (activeProfile?.id === id) {
      setActiveProfile(prev => prev ? { ...prev, name, avatar } : null);
    }
  };

  const handleStartSession = (
    taskType: TaskType, 
    selectedTable: number | null, 
    difficulty: Difficulty, 
    gameMode: GameMode, 
    timeLimit?: number
  ) => {
    setSessionConfig({ taskType, selectedTable, difficulty, gameMode, timeLimit });
    setCurrentScreen('SESSION');
  };

  const [isNewHighscore, setIsNewHighscore] = useState(false);

  const handleSessionFinish = (state: SessionState) => {
    setLastSessionState(state);

    // Update profile score
    if (activeProfile) {
      const updatedProfile = { ...activeProfile };

      // Update total score
      updatedProfile.totalScore += state.score;

      // Update history
      updatedProfile.history = [...updatedProfile.history, {
        date: Date.now(),
        score: state.score,
        mode: sessionConfig.gameMode,
        difficulty: sessionConfig.difficulty
      }];

      // Update analytics data
      updatedProfile.telemetryHistory = [...(updatedProfile.telemetryHistory || []), ...(state.telemetryEvents || [])];
      updatedProfile.cognitiveTimeline = [...(updatedProfile.cognitiveTimeline || []), ...(state.cognitiveTimeline || [])];
      updatedProfile.plannerDecisions = [...(updatedProfile.plannerDecisions || []), ...(state.plannerDecisions || [])];

      // Ensure no undefined values
      updatedProfile.telemetryHistory = updatedProfile.telemetryHistory.filter(Boolean);
      updatedProfile.cognitiveTimeline = updatedProfile.cognitiveTimeline.filter(Boolean);
      updatedProfile.plannerDecisions = updatedProfile.plannerDecisions.filter(Boolean);

      // Update Highscores
      const categoryKey = sessionConfig.taskType === '1x1' && sessionConfig.selectedTable 
        ? `1x1-${sessionConfig.selectedTable}-${sessionConfig.difficulty}-${sessionConfig.gameMode}`
        : `${sessionConfig.taskType}-${sessionConfig.difficulty}-${sessionConfig.gameMode}`;

      const currentHighscores = updatedProfile.highscores?.[categoryKey] || [];
      const isNew = currentHighscores.length === 0 || state.score > currentHighscores[0];
      setIsNewHighscore(isNew);

      const newHighscores = [...currentHighscores, state.score]
        .sort((a, b) => b - a)
        .slice(0, 5); // Keep top 5

      updatedProfile.highscores = {
        ...(updatedProfile.highscores || {}),
        [categoryKey]: newHighscores
      };

      setProfiles(prev => prev.map(p => p.id === activeProfile.id ? updatedProfile : p));
      setActiveProfile(updatedProfile);
    }

    setCurrentScreen('SUMMARY');
  };

  const handleLeaderboardOpen = () => {
    setCurrentScreen('LEADERBOARD');
  };

  const handleDashboardOpen = () => {
    setCurrentScreen('DASHBOARD');
  };

  // --- Render ---

  if (currentScreen === 'PROFILE') {
    return (
      <ProfileSelector
        profiles={profiles}
        createProfile={handleCreateProfile}
        selectProfile={handleSelectProfile}
        deleteProfile={handleDeleteProfile}
        updateProfile={handleUpdateProfile}
        onOpenLeaderboard={handleLeaderboardOpen}
        onOpenDashboard={handleDashboardOpen}
      />
    );
  }

  if (currentScreen === 'START') {
    return (
      <StartScreen
        onStart={handleStartSession}
        onBack={() => setCurrentScreen('PROFILE')}
        onOpenLeaderboard={handleLeaderboardOpen}
      />
    );
  }

  if (currentScreen === 'SESSION' && activeProfile) {
    return (
      <MathSessionScreen
        activeProfile={activeProfile}
        taskType={sessionConfig.taskType}
        selectedTable={sessionConfig.selectedTable}
        difficulty={sessionConfig.difficulty}
        gameMode={sessionConfig.gameMode}
        timeLimit={sessionConfig.timeLimit}
        studentModel={studentModel}
        onFinish={handleSessionFinish}
        onExit={() => setCurrentScreen('START')}
      />
    );
  }

  if (currentScreen === 'SUMMARY' && lastSessionState) {
    return (
      <SessionSummary
        sessionState={lastSessionState}
        taskType={sessionConfig.taskType}
        onRestart={() => setCurrentScreen('SESSION')}
        onMenu={() => setCurrentScreen('START')}
        isNewHighscore={isNewHighscore}
      />
    );
  }

  if (currentScreen === 'LEADERBOARD') {
    return (
      <Leaderboard
        profiles={profiles}
        onClose={() => setCurrentScreen(activeProfile ? 'START' : 'PROFILE')}
      />
    );
  }

  if (currentScreen === 'DASHBOARD' && dashboardProfile) {
    // Generate Dashboard Data on the fly
    // In a real app, this would be cached or fetched
    const snapshot = SnapshotBuilder.build(
      dashboardStudentModel,
      dashboardProfile.telemetryHistory || [],
      CognitiveLoadState.OPTIMAL, // Default
      'mixed'
    );
    const kpis = KPICalculator.calculateKPIs(snapshot);
    const insights = KPICalculator.generateInsights(snapshot);

    // Reconstruct learning history from telemetry
    const learningHistory = (dashboardProfile.telemetryHistory || [])
        .filter(e => e.type === 'session_end')
        .map((e, i, arr) => {
            // Find events for this specific task (between previous session_end and this one)
            const prevEndIndex = i === 0 ? -1 : (dashboardProfile.telemetryHistory || []).indexOf(arr[i-1]);
            const currentIndex = (dashboardProfile.telemetryHistory || []).indexOf(e);
            const taskEvents = (dashboardProfile.telemetryHistory || []).slice(prevEndIndex + 1, currentIndex + 1);

            const errors = taskEvents.filter(te => te.type === 'error').length;
            const steps = taskEvents.filter(te => te.type === 'step_transition').length;
            const total = steps + errors;
            const accuracy = total > 0 ? steps / total : 1.0;

            return {
                timestamp: e.timestamp || Date.now(),
                accuracy: isNaN(accuracy) ? 1.0 : accuracy,
                loadState: CognitiveLoadState.OPTIMAL, // Default proxy
                difficulty: 0.5 // Default proxy
            };
        });

    return (
      <div className="relative">
        <button 
          onClick={() => setCurrentScreen(activeProfile ? 'START' : 'PROFILE')}
          className="fixed top-4 right-4 z-50 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Schließen
        </button>
        <Dashboard
          profiles={profiles}
          activeProfileId={dashboardProfile.id}
          onProfileChange={(id) => setDashboardProfileId(id)}
          snapshot={snapshot}
          kpis={kpis}
          insights={insights}
          plannerHistory={dashboardProfile.plannerDecisions || []}
          learningHistory={learningHistory}
          cognitiveTimeline={dashboardProfile.cognitiveTimeline || []}
        />
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;
