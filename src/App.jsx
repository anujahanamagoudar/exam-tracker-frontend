import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import StudyTimer from "./components/StudyTimer";
import StudyTracker from "./components/StudyTracker";
import "./App.css";

function App() {
  const [auth, setAuth] = useState(null); // null = loading

  useEffect(() => {
    const user = localStorage.getItem("userId");
    if (user) {
      setAuth(true);
    } else {
      setAuth(false);
    }
  }, []);

  // Prevent blank screen while checking auth
  if (auth === null) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={auth ? <Navigate to="/dashboard" /> : <Login setAuth={setAuth} />} />
        <Route path="/login" element={auth ? <Navigate to="/dashboard" /> : <Login setAuth={setAuth} />} />
        <Route path="/register" element={<Register />} />

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
