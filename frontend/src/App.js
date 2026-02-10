import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
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
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GameView />} />
          <Route path="/task/:taskId" element={<TaskView />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
