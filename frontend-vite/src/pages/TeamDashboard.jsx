import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        // Fetch team details
        const teamRes = await api.get(`team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(teamRes.data.team);

        // Fetch team members
        const membersRes = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(membersRes.data.members);
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, navigate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{team.name} Dashboard</h1>
      <p>Your Role: {team.user_role}</p>
      <p>Created At: {new Date(team.created_at).toLocaleDateString()}</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.id} className="p-4 border rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{member.username}</p>
                  <p className="text-sm text-gray-600">Role: {member.role}</p>
                </div>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled
                >
                  Invite
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}