// src/pages/InviteMarkers.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function InviteMarkers() {
  const { teamId } = useParams();
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [existingMembers, setExistingMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  // 获取团队成员和待处理邀请
  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // 获取团队成员
      const membersRes = await api.get(`/team/${teamId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamMembers(membersRes.data);

      // 获取待处理邀请
      const invitesRes = await api.get(`/team/${teamId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingInvites(invitesRes.data);
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    }
  };

  const handleAddEmail = () => {
    if (!inviteEmail.trim()) return;

    const email = inviteEmail.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteStatus("❌ Please enter a valid email address");
      return;
    }

    // Check for duplicates in the current list
    if (emailsList.includes(email)) {
      setInviteStatus("❌ Email already in the list");
      return;
    }

    // Check if already a team member
    const isAlreadyMember = teamMembers.some(member => 
      member.email?.toLowerCase() === email || member.username?.toLowerCase() === email
    );
    
    if (isAlreadyMember) {
      setInviteStatus(`❌ ${email} is already a team member`);
      return;
    }

    // Check for existing pending invites
    const hasPendingInvite = pendingInvites.some(invite => 
      invite.invitee_email?.toLowerCase() === email
    );
    
    if (hasPendingInvite) {
      setInviteStatus(`❌ ${email} already has a pending invitation`);
      return;
    }

    setEmailsList([...emailsList, email]);
    setInviteEmail("");
    setInviteStatus(null);
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmailsList(emailsList.filter(email => email !== emailToRemove));
  };

  const handleInviteMultiple = async () => {
    const token = localStorage.getItem("token");
    if (emailsList.length === 0) {
      setInviteStatus("Add at least one email.");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending invite request:", {
        emails: emailsList,
        message: inviteMessage,
        teamId
      });

      const response = await api.post(
        `/team/${teamId}/invite`,
        { 
          emails: emailsList,
          message: inviteMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Invite response:", response.data);
      
      // Detail the results
      if (response.data.results) {
        const successCount = response.data.results.filter(r => r.status === "sent").length;
        const alreadyMemberCount = response.data.results.filter(r => r.status === "already_member").length;
        const alreadyInvitedCount = response.data.results.filter(r => r.status === "already_invited").length;
        
        let statusMessage = `${successCount} invitation(s) sent successfully!`;
        if (alreadyMemberCount > 0) {
          statusMessage += ` ${alreadyMemberCount} user(s) were already team members.`;
        }
        if (alreadyInvitedCount > 0) {
          statusMessage += ` ${alreadyInvitedCount} user(s) already had pending invitations.`;
        }
        
        setInviteStatus(statusMessage);
      } else {
        setInviteStatus("Invitations sent successfully!");
      }
      
      setEmailsList([]);
      setInviteMessage("");
      
      // Refresh team data
      fetchTeamData();
    } catch (err) {
      console.error("Failed to send invites:", err);
      console.error("Error details:", err.response?.data);
      setInviteStatus(`❌ Failed to send invites: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-72 flex-1 flex flex-col relative">
        <Navbar />

        <div className="px-6 py-6 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Invite Markers</h1>

          {/* List of current members and pending invites */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Team has {teamMembers.length} members and {pendingInvites.length} pending invitations.
            </p>
          </div>

          {/* Input + Add button */}
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter marker email"
              className="px-3 py-2 border border-gray-300 rounded-md flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddEmail();
              }}
            />
            <button
              onClick={handleAddEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {/* List of emails */}
          <ul className="mb-4">
            {emailsList.map((email) => (
              <li
                key={email}
                className="flex justify-between items-center px-3 py-2 bg-white border rounded-md mb-2"
              >
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {/* Invitation Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Message (Optional)
            </label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleInviteMultiple}
            disabled={loading || emailsList.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Invites"}
          </button>

          {/* Status */}
          {inviteStatus && (
            <div className={`mt-3 text-sm p-3 rounded-md ${
              inviteStatus.includes("❌") 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {inviteStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}