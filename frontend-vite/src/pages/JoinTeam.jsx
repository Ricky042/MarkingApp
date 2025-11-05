import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/axios";
import LoadingSpinner from "../components/LoadingSpinner";

export default function JoinTeam() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // invite token from URL
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);

  useEffect(() => {
    const checkInvite = async () => {
      console.log("=== JoinTeam page started ===");
      console.log("Invite token from URL:", token);

      if (!token) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      const storedJWT = localStorage.getItem("token");
      console.log("Stored JWT:", storedJWT);

      const storedUserJSON = localStorage.getItem("user");
      const storedUser = storedUserJSON ? JSON.parse(storedUserJSON) : null;
      console.log("Current logged-in user:", storedUser);

      if (!storedUser) {
        console.log("Not logged in. Storing pending invite and redirecting to login/signup.");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("authChange"));
        sessionStorage.setItem("pendingInviteToken", token);
        navigate("/login");
        return;
      }

      try {
        const res = await api.get(`/team/invite/${token}`, {
          headers: { Authorization: `Bearer ${storedJWT}` },
        });

        console.log("Invite fetched:", res.data);
        setInvite(res.data);

        // Verify that the invite email matches the logged-in user
        if (storedUser.username !== res.data.invitee_email) {
            console.warn("Logged-in user does not match invitee email.");

            // Clear stored user and token
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.dispatchEvent(new Event("authChange"));

            // Save the pending invite token so user can accept after logging in
            sessionStorage.setItem("pendingInviteToken", token);

            // Redirect to login
            navigate("/login");
            return;
        }

      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.log("JWT invalid/expired. Storing pending invite and redirecting to login/signup.");
          sessionStorage.setItem("pendingInviteToken", token);
          navigate("/login");
        } else {
          console.error("Error fetching invite:", err);
          setError(err.response?.data?.error || "Failed to fetch invite");
        }
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token, navigate]);

  const handleRespond = async (action) => {
    const storedJWT = localStorage.getItem("token");
    if (!storedJWT) return navigate("/login");

    try {
      const res = await api.post(
        `/team/invite/${token}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${storedJWT}` } }
      );

      console.log("Invite response:", res.data);
      setResponseStatus(res.data.message);

      sessionStorage.removeItem("pendingInviteToken");

      if (action === "accept") {
        navigate(`/team/${invite.team_id}/dashboard`);
      } else {
        // Check if user has other teams
        const teamRes = await api.get("/my-team", {
          headers: { Authorization: `Bearer ${storedJWT}` },
        });
        if (teamRes.data.hasTeams && teamRes.data.teams.length > 0) {
          navigate(`/team/${teamRes.data.teams[0].id}/dashboard`);
        } else {
          navigate("/create-team");
        }
      }
    } catch (err) {
      console.error("Failed to respond to invite:", err);
      setError(err.response?.data?.error || "Failed to respond to invite");
    }
  };

  if (loading) return <LoadingSpinner pageName="Join Team" />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!invite) return null;

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Team Invitation</h1>
      <p className="mb-2">
        You've been invited to join the team: <strong>{invite.team_name}</strong>
      </p>
      <p className="mb-4">Inviter: {invite.inviter_email}</p>
      {responseStatus && <p className="mb-4 text-green-600">{responseStatus}</p>}

      <div className="flex justify-between">
        <button
          onClick={() => handleRespond("accept")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Accept
        </button>
        <button
          onClick={() => handleRespond("deny")}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
