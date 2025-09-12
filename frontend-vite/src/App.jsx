import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgetpassword from "./pages/Forgetpassword";
import CreateTeam from "./pages/CreateTeam";
import TeamDashboard from "./pages/TeamDashboard";
import CreateAssignment from "./pages/CreateAssignment";
import InviteMarkers from "./pages/InviteMarkers";
import JoinTeam from "./pages/JoinTeam";
import Assignments from "./pages/Assignments";
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

  // New component to handle the logic for the join-team route
  const JoinTeamRoute = () => {
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    if (isLoggedIn) {
      // If user is logged in, they can see the page.
      // We should also clear the pending token now that they've reached the page.
      sessionStorage.removeItem("pendingInviteToken");
      return <JoinTeam />;
    }

    // If user is not logged in, save the token and redirect to login.
    if (token) {
      sessionStorage.setItem('pendingInviteToken', token);
    }

    return <Navigate to="/login" replace />;
  };


  if (isLoading) return <div style={{ display: 'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading...</div>;

  const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");

  const loggedInRedirect = pendingInviteToken
    ? <Navigate to={`/join-team?token=${pendingInviteToken}`} replace />
    : (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}/dashboard`} replace /> : <Navigate to="/create-team" replace />);

  return (
    <Router>

        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn
                  ? (userTeams.length > 0 ? <Navigate to={`/team/${userTeams[0].id}/dashboard`} replace /> : <Navigate to="/create-team" replace />)
                  : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/login"
            element={isLoggedIn ? loggedInRedirect : <Login />}
          />

          <Route
            path="/signup"
            element={isLoggedIn ? loggedInRedirect : <Signup />}
          />

          <Route
            path="/forgetpassword"
            element={isLoggedIn ? loggedInRedirect : <Forgetpassword />}
          />

          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team/:teamId/dashboard" element={<TeamDashboard />} />
          <Route path="/join-team" element={<JoinTeamRoute />} />
          <Route path="/team/:teamId/assignments/new" element={<CreateAssignment />} />
          <Route path="/team/:teamId/invite" element={<InviteMarkers />} />
          <Route path="/team/:teamId/assignments" element={<Assignments />} />
        </Routes>
    </Router>
  );
}

export default App;