import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import StudyTimer from "./components/StudyTimer";
import StudyTracker from "./components/StudyTracker";
import "./App.css";

function App() {
  // 🔑 Persist login after refresh (initial load)
  const [auth, setAuth] = useState(() => {
    return localStorage.getItem("userId") ? true : false;
  });

  // 🔄 Restore auth on page reload (important for cloud)
  useEffect(() => {
    const user = localStorage.getItem("userId");
    if (user) {
      setAuth(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login setAuth={setAuth} />} />
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={auth ? <StudyTracker /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/timer"
          element={auth ? <StudyTimer /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
