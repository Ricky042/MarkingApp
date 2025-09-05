import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/navBar";

import MembersTab from "../components/TeamDashboard/MembersTab";
import AssignmentsTab from "../components/TeamDashboard/AssignmentsTab";

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState("members");

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [inviteStatus, setInviteStatus] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const teamRes = await api.get(`/team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(teamRes.data.team);

        const membersRes = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(membersRes.data.members);

        const assignmentsRes = await api.get(`/team/${teamId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignments(assignmentsRes.data.assignments || []);
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, navigate]);

  // Invite logic
  const handleAddEmail = () => {
    if (!inviteEmail.trim()) return;
    if (!emailsList.includes(inviteEmail.trim())) {
      setEmailsList([...emailsList, inviteEmail.trim()]);
      setInviteEmail("");
    }
  };

  const handleRemoveEmail = (email) => {
    setEmailsList(emailsList.filter((e) => e !== email));
  };

  const handleInviteMultiple = async () => {
    const token = localStorage.getItem("token");
    if (emailsList.length === 0) return setInviteStatus("Add at least one email.");

    try {
      await api.post(
        `/team/${teamId}/invite`,
        { emails: emailsList },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteStatus("Invitations sent successfully!");
      setEmailsList([]);
    } catch (err) {
      console.error("Failed to send invites:", err);
      setInviteStatus("Failed to send invites.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixed to the left */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      {/* Navbar to the right of Sidebar */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{team.name} Dashboard</h1>
          </div>
          <p>Your Role: {team.user_role}</p>
          <p>Created At: {new Date(team.created_at).toLocaleDateString()}</p>
          {/* Tabs */}
          <div className="mt-6 border-b flex space-x-4">
            <button
              className={`pb-2 ${activeTab === "members" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              Members
            </button>
            <button
              className={`pb-2 ${activeTab === "assignments" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </button>
          </div>
          {/* Tab Content */}
          {activeTab === "members" && (
            <MembersTab
              members={members}
              team={team}
              onInviteClick={() => setShowInviteModal(true)}
            />
          )}
          {activeTab === "assignments" && (
            <AssignmentsTab
              assignments={assignments}
              setAssignments={setAssignments}
              team={team}
              userRole={team.user_role}
            />
          )}
          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Blurred background */}
              <div className="absolute inset-0 backdrop-blur-sm"></div>
              {/* Modal content */}
              <div className="relative bg-white p-6 rounded shadow-lg w-96 z-10">
                <h2 className="text-lg font-semibold mb-4">Invite Members</h2>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
                {emailsList.length > 0 && (
                  <ul className="mb-4">
                    {emailsList.map((email, idx) => (
                      <li key={idx} className="text-sm flex justify-between items-center">
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="text-red-500 ml-2"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteMultiple}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Send Invites
                  </button>
                </div>
                {inviteStatus && <p className="mt-2 text-sm">{inviteStatus}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
