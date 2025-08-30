import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

export default function CreateTeam() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateTeam = async () => {
    if (!name.trim()) {
      alert("Team name is required.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await api.post(
        "/create-team",
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Team created:", res.data);

      // Redirect to the new team's dashboard
      const newTeamId = res.data.team.id;
      navigate(`/team/${newTeamId}`);
    } catch (err) {
      console.error("Failed to create team:", err);
      alert(err.response?.data?.message || "Failed to create team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create a New Team</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Team Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          onClick={handleCreateTeam}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </div>
  );
}
