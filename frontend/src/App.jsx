// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import JoinGroup from "./pages/JoinGroup";
import FilesWrapper from "./pages/FilesWrapper";
import TasksWrapper from "./pages/TasksWrapper";

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <PrivateRoute>
              <GroupDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/join/:inviteCode"
          element={
            <PrivateRoute>
              <JoinGroup />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:id/files"
          element={
            <PrivateRoute>
              <FilesWrapper />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:id/tasks"
          element={
            <PrivateRoute>
              <TasksWrapper />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
