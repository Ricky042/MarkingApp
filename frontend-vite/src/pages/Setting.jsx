import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Setting() {
    const navigate = useNavigate();
    const { teamId } = useParams();
    const [userTeams, setUserTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [showTips, setShowTips] = useState(false);
    const [tipsContent, setTipsContent] = useState("");

    useEffect(() => {
        async function fetchTeams() {
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("/my-team", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.data.teams && res.data.teams.length > 0) {
                    setUserTeams(res.data.teams);
                }
            } catch (err) {
                console.error("Error fetching teams:", err);
            }
        }
        fetchTeams();
    }, []);

    useEffect(() => {
        if (teamId) {
            setSelectedTeamId(teamId);
        }
    }, [teamId]);

    const handleSwitchTeam = (e) => {
        navigate(`/team/${e.target.value}/dashboard`);
    };

    const handleShowTips = async () => {
        try {
            const res = await fetch("/UserTips.txt");
            const text = await res.text();
            setTipsContent(text);
            setShowTips(true);
    } catch (err) {
        console.error("Failed to load User Tips:", err);
        alert("Unable to load user tips.");
        }
    };

    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
                <Sidebar />
            </aside>
            <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
                <Navbar />
                <div className="flex-1 flex flex-col justify-start items-start p-6">
                    <label className="mb-2 font-semibold text-slate-700">Switch Team:</label>
                    <select
                        className="mb-6 px-4 py-2 border rounded bg-white text-slate-900"
                        value={selectedTeamId}
                        onChange={handleSwitchTeam}
                    >
                        {userTeams.map(team => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mb-4"
                        onClick={() => navigate("/create-team")}
                    >
                        Create Team
                    </button>
                
                {/* "User Tips" button */}
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                        onClick={handleShowTips}
                    >
                        View User Tips
                    </button>
                </div>

                {/* Popup for user tips */}
                {showTips && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                        <div className="bg-white w-3/4 max-w-2xl p-6 rounded-lg shadow-lg relative overflow-y-auto max-h-[80vh]">
                            <h2 className="text-xl font-bold mb-4">User Tips</h2>
                            <pre className="whitespace-pre-wrap text-sm text-gray-700">{tipsContent}</pre>
                            <button
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                                onClick={() => setShowTips(false)}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}