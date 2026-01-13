import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import StudyTimer from "./components/StudyTimer";
import StudyTracker from "./components/StudyTracker";
import "./App.css";

function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem("userId"));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/register" element={<Register />} />

        {/* THIS is your dashboard */}
        <Route
          path="/dashboard"
          element={auth ? <StudyTracker /> : <Navigate to="/login" />}
        />

        <Route
          path="/timer"
          element={auth ? <StudyTimer /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
