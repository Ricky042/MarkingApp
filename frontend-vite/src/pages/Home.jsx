import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../utils/axios";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Unknown");
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndTeams = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username || "Unknown");

        // Fetch teams
        const res = await api.get("/my-team", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.hasTeams) {
          setTeams(res.data.teams);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndTeams();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const handleCreateTeam = () => {
    navigate("/create-team"); // redirect to CreateTeam page
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {username}!</h1>

      {teams.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 border rounded shadow">
                <div className="flex items-start gap-4">
                  {team.profile_picture && (
                    <img
                      src={team.profile_picture}
                      alt={`${team.name} logo`}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Your Role:</strong> {team.user_role}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <p className="text-gray-600">You are not part of any team yet.</p>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleCreateTeam}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Team
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}