import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

export default function TeamSwitcher() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/my-team", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.hasTeams) {
          setTeams(res.data.teams);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamChange = (teamId) => {
    navigate(`/team/${teamId}/dashboard`);
  };

  return (
    <div className="team-switcher">
      <select
        onChange={(e) => handleTeamChange(e.target.value)}
        defaultValue=""
        className="p-2 border rounded"
      >
        <option value="" disabled>
          Select a Team
        </option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}