import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgetpassword from "./pages/Forgetpassword";
import CreateTeam from "./pages/CreateTeam";
import TeamDashboard from "./pages/TeamDashboard";
import JoinTeam from "./pages/JoinTeam";
import api from "./utils/axios";
import { jwtDecode } from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userTeams, setUserTeams] = useState([]); // stores teams for redirecting

  const getAuthStatus = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp < now + 60) {
        localStorage.removeItem("token");
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem("token");
      return false;
    }
  };

  // fetch user's teams
  const fetchTeams = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      const res = await api.get("/my-team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.teams || [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = getAuthStatus();
      setIsLoggedIn(authStatus);

      if (authStatus) {
        const teams = await fetchTeams();
        setUserTeams(teams);
      }

      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  if (isLoading) return <div style={{ display: 'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading...</div>;

  const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");

  console.log("=== App render ===");
  console.log("isLoggedIn:", isLoggedIn);
  console.log("isLoading:", isLoading);
  console.log("userTeams:", userTeams);
  console.log("pendingInviteToken:", pendingInviteToken);

  return (
    <Router>

        <Routes>
          <Route
            path="/"
            element={
              pendingInviteToken
                ? <Navigate to={`/join-team?token=${pendingInviteToken}`} replace />
                : isLoggedIn
                  ? (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}`} replace /> : <Navigate to="/create-team" replace />)
                  : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/login"
            element={
              isLoggedIn
                ? (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}`} replace /> : <Navigate to="/create-team" replace />)
                : <Login />
            }
          />

          <Route
            path="/signup"
            element={
              isLoggedIn
                ? (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}`} replace /> : <Navigate to="/create-team" replace />)
                : <Signup />
            }
          />

          <Route
            path="/forgetpassword"
            element={
              pendingInviteToken
                ? <Navigate to={`/join-team?token=${pendingInviteToken}`} replace />
                : !isLoggedIn
                  ? <Forgetpassword />
                  : (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}`} replace /> : <Navigate to="/create-team" replace />)
            }
          />

          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team/:teamId" element={<TeamDashboard />} />
          <Route path="/join-team" element={<JoinTeam />} />
        </Routes>
    </Router>
  );
}

export default App;
