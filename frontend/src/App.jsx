import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ExploreProjects from "./pages/ExploreProjects";
import AdminDashboard from "./pages/AdminDashboard";
import CreateProject from "./pages/CreateProject";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminTaskManager from "./pages/AdminTaskManager";
import CollaboratorTaskManager from "./pages/CollaboratorTaskManager";

import "./App.css";

function App() {
  return (
    <div className="App"> { }
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ExploreProjects /></ProtectedRoute>} />   
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/create-project" element={<ProtectedRoute role="admin"><CreateProject /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute role="admin"><AdminTaskManager /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><CollaboratorTaskManager /></ProtectedRoute>} />   
          
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;