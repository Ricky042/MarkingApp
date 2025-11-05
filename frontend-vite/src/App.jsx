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
import AssignmentDetails from "./pages/AssignmentDetails";
import MarkingPage from "./pages/MarkingPage";
import IndividualDashboard from "./pages/IndividualDashboard";
import AssignmentMakers from "./pages/AssignmentMakers";
import ReportsDetails from "./pages/ReportsDetails";
import Setting from "./pages/Setting";
import Markers from "./pages/Markers";
import Reports from "./pages/Reports";
import api from "./utils/axios";
import { jwtDecode } from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userTeams, setUserTeams] = useState([]);

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
        try {
          const teams = await fetchTeams();
          setUserTeams(teams);
        } catch (error) {
          console.error("Failed to fetch teams:", error);
          setUserTeams([]);
        }
      }

      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = () => {
      setIsLoading(true);
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  const JoinTeamRoute = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    console.log('JoinTeamRoute - Token from URL:', token);
    console.log('JoinTeamRoute - User logged in:', isLoggedIn);

    if (isLoggedIn) {
      sessionStorage.removeItem("pendingInviteToken");
      return <JoinTeam />;
    }

    // If not logged in, save the token and redirect to login
    if (token) {
      console.log('Saving pending invite token:', token);
      sessionStorage.setItem('pendingInviteToken', token);
      
      // Redirect to login with redirect back to join-team
      const redirectPath = `/join-team?token=${token}`;
      return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    }

    // If no token is present, redirect to login
    return <Navigate to="/login" replace />;
  };

  // Redirect logged-in users appropriately
  const getLoggedInRedirect = () => {
    const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");
    
    if (pendingInviteToken) {
      console.log('Redirecting to join-team with token:', pendingInviteToken);
      sessionStorage.removeItem("pendingInviteToken");
      return <Navigate to={`/join-team?token=${pendingInviteToken}`} replace />;
    }
    
    return userTeams.length > 0 
      ? <Navigate to={`/team/${userTeams[0].id}/dashboard`} replace /> 
      : <Navigate to="/create-team" replace />;
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading...</div>;

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
          element={isLoggedIn ? getLoggedInRedirect() : <Login />}
        />

        <Route
          path="/signup"
          element={isLoggedIn ? getLoggedInRedirect() : <Signup />}
        />

        <Route
          path="/forgetpassword"
          element={isLoggedIn ? getLoggedInRedirect() : <Forgetpassword />}
        />

        <Route path="/create-team" element={<CreateTeam />} />
        <Route path="/team/:teamId/dashboard" element={<TeamDashboard />} />
        <Route path="/join-team" element={<JoinTeamRoute />} />
        <Route path="/team/:teamId/assignments/new" element={<CreateAssignment />} />
        <Route path="/team/:teamId/invite" element={<InviteMarkers />} />
        <Route path="/team/:teamId/assignments" element={<Assignments />} />
        <Route path="/team/:teamId/assignments/:assignmentId" element={<AssignmentDetails />} />
        <Route path="/team/:teamId/assignments/:assignmentId/mark" element={<MarkingPage />} />
        <Route path="/dashboard" element={<IndividualDashboard />} />
        <Route path="/team/:teamId/assignments/:assignmentId/assignmentmarkers" element={<AssignmentMakers />} />
        <Route path="/team/:teamId/settings" element={<Setting />} />
        <Route path="/team/:teamId/markers" element={<Markers />} />
        <Route path="/team/:teamId/reports" element={<Reports />} />
        <Route path="/team/:teamId/reports/:assignmentId" element={<ReportsDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;