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

  

  /*const handleInviteMultiple = async () => {
    const token = localStorage.getItem("token");
    if (emailsList.length === 0) {
      setInviteStatus("Add at least one email.");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        `/team/${teamId}/invite`,
        { 
          emails: emailsList,
          message: inviteMessage // Send the message along with invites
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteStatus("✅ Invitations sent successfully!");
      setEmailsList([]);
      setInviteMessage(""); // Clear message after sending
    } catch (err) {
      console.error("Failed to send invites:", err);
      setInviteStatus("❌ Failed to send invites.");
    } finally {
      setLoading(false);
    }
  };*/
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
    setInviteStatus("✅ Invitations sent successfully!");
    setEmailsList([]);
    setInviteMessage("");
  } catch (err) {
    console.error("Failed to send invites:", err);
    console.error("Error details:", err.response?.data);
    setInviteStatus(`❌ Failed to send invites: ${err.response?.data?.error || err.message}`);
  } finally {
    setLoading(false);
  }
};


const handleAcceptInvite = async () => {
  try {
    const token = localStorage.getItem('token'); // 用户登录token
    const response = await fetch(`/api/team/invite/${inviteToken}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'accept'
      })
    });
    
    const result = await response.json();
    console.log('Accept response:', result);
  } catch (error) {
    console.error('Error accepting invite:', error);
  }
};
  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="ml-72 flex-1 flex flex-col relative">
        <Navbar />

        <div className="px-6 py-6 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Invite Markers</h1>

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
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
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
                  className="text-red-500 text-sm"
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
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            {loading ? "Sending..." : "Send Invites"}
          </button>

          {/* Status */}
          {inviteStatus && (
            <div className="mt-3 text-sm text-gray-700">{inviteStatus}</div>
          )}
        </div>
      </div>
    </div>
  );
}