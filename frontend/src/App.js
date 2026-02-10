import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { TaskContainer } from "./components/game/TaskContainer";
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
      <div className="App" style={{ background: 'var(--bg-default)' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GameView />} />
            <Route path="/task/:taskId" element={<TaskView />} />
          </Routes>
        </BrowserRouter>
        <ThemeToggle />
        <Toaster position="top-center" />
      </div>
    </ThemeProvider>
  );
}

export default App;
