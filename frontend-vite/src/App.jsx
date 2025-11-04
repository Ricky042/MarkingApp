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

  // fetch user's pending invites
  const fetchPendingInvites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = await api.get("/my-invites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data && res.data.length > 0 ? res.data[0] : null; // Return first pending invite
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Don't set loading to false prematurely. Let it stay true.
      const authStatus = getAuthStatus();
      setIsLoggedIn(authStatus);

      if (authStatus) {
        try {
          const teams = await fetchTeams();
          setUserTeams(teams);
          
          // Check for pending invites if user has no teams or no pending invite token
          const existingPendingToken = sessionStorage.getItem("pendingInviteToken");
          if (!existingPendingToken) {
            const pendingInvite = await fetchPendingInvites();
            if (pendingInvite && pendingInvite.token) {
              // Save token and redirect to join-team page
              sessionStorage.setItem("pendingInviteToken", pendingInvite.token);
            }
          }
        } catch (error) {
          // Handle potential errors during team fetching
          console.error("Failed to fetch teams:", error);
          setUserTeams([]); // Ensure teams is empty on error
        }
      }

      // ONLY set isLoading to false after all checks and fetches are complete.
      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = () => {
      // When auth changes, we need to re-evaluate everything, so reset loading state
      setIsLoading(true);
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []); // The empty dependency array is correct

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