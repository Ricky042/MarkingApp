import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const teamRes = await api.get(`team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(teamRes.data.team);

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

  const handleInvite = async () => {
    const token = localStorage.getItem("token");
    if (!inviteEmail) return setInviteStatus("Please enter an email.");

    try {
      await api.post(
        `/team/${teamId}/invite`,
        { email: inviteEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteStatus("Invitation sent successfully!");
      setInviteEmail("");
    } catch (err) {
      console.error("Failed to send invite:", err);
      setInviteStatus("Failed to send invite.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{team.name} Dashboard</h1>
      </div>

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
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Invite
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
            <input
              type="email"
              placeholder="Enter email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            {inviteStatus && (
              <p className="text-sm mb-2">{inviteStatus}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
