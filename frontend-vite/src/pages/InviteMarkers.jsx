// src/pages/InviteMarkers.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function InviteMarkers() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [inviteEmail, setInviteEmail] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [inviteStatus, setInviteStatus] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="ml-56 flex-1 flex flex-col relative">
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
