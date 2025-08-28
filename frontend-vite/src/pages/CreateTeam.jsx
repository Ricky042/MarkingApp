import { useState } from "react";
import axios from "axios";

export default function CreateTeam() {
  const [teamName, setTeamName] = useState("");

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/create-team", { name: teamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = "/home"; // redirect after success
    } catch (err) {
      console.error("Team creation failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Create Your Team</h1>
      <input
        type="text"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Team name"
        className="border p-2 rounded mb-4"
      />
      <button
        onClick={handleCreate}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Team
      </button>
    </div>
  );
}
