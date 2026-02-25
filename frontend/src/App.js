import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { TaskContainer } from "./components/game/TaskContainer";
import { OnboardingModal } from "./components/profile/OnboardingModal";
import { AdminPage } from "./pages/AdminPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { Toaster } from "./components/ui/sonner";

// Main game view - loads random task
const GameView = () => {
  return <TaskContainer />;
};

// Direct task view - loads specific task from URL
const TaskView = () => {
  const { taskId } = useParams();
  return <TaskContainer initialTaskId={taskId} />;
};

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <div className="App" style={{ background: 'var(--bg-default)' }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<GameView />} />
              <Route path="/task/:taskId" element={<TaskView />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/u/:username" element={<UserProfilePage />} />
            </Routes>
            <OnboardingModal />
          </BrowserRouter>
          <Toaster position="top-center" />
        </div>
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;
