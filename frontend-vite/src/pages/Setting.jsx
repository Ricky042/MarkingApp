import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function Setting() {
    const navigate = useNavigate();
    const { teamId } = useParams();
    const [userTeams, setUserTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [showTips, setShowTips] = useState(false);
    const [tipsContent, setTipsContent] = useState("");
    const [username, setUsername] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

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

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setUsername(user.username);
            setUserEmail(user.username); // username is the email
        }
    }, []);

    const handleSelectTeam = (teamId) => {
        setSelectedTeamId(teamId);
        setIsDropdownOpen(false);
        navigate(`/team/${teamId}/dashboard`);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

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

    const handleLogout = () => {
        // Clear user authentication data from storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Notify the app that authentication state has changed
        window.dispatchEvent(new Event("authChange"));

        // Navigate to the login page
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
                <Sidebar activeTab={4}/>
            </aside>
            
            <div className="ml-72 flex-1 flex flex-col bg-neutral-100">
                <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
                <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
                
                <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : "mr-0"}`}>
                    <div className="flex-1 flex flex-col justify-start items-start p-6">
                    {/* User Profile Section */}
                    <div className="w-full bg-white rounded-lg border-1 border-slate-200 p-6 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Profile</h2>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 shrink-0">
                                <img
                                    src="/navBarIcon/navBar_Ellipse 1.svg"
                                    alt="User Avatar"
                                    className="h-16 w-16"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-900 text-xl leading-none font-semibold font-['Inter'] tracking-wide select-none">
                                        {username ? username.charAt(0).toUpperCase() : ""}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold text-slate-900">{username}</h3>
                                <p className="text-sm text-slate-600">{userEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="w-full bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-start items-start">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Settings</h2>
                        
                        {/* Switch Team Row */}
                        <div className="w-full flex flex-row justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <label className="font-semibold text-slate-700 text-md mb-1">Switch Team</label>
                                <p className="text-sm text-slate-600">Change your active team workspace</p>
                            </div>
                            <div className="relative w-52 dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-3 py-2.5 bg-white rounded-lg cursor-pointer border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                                >
                                    <span className={`text-sm font-medium ${selectedTeamId ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {selectedTeamId ? userTeams.find(team => String(team.id) === String(selectedTeamId))?.name || "Select team" : "Select team"}
                                    </span>
                                    <img 
                                        src="/AssignmentIcon/chevron-down.svg" 
                                        alt="Dropdown arrow" 
                                        className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                                    />
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                                        {userTeams.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-slate-500">No teams available</div>
                                        ) : (
                                            userTeams.map((team) => {
                                                const isSelected = String(team.id) === String(selectedTeamId);
                                                return (
                                                    <button
                                                        key={team.id}
                                                        type="button"
                                                        onClick={() => handleSelectTeam(team.id)}
                                                        className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                                            isSelected 
                                                                ? 'bg-slate-100 text-slate-900 font-semibold' 
                                                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>{team.name}</span>
                                                            {isSelected && (
                                                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Create Team Row */}
                        <div className="w-full flex flex-row justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <label className="font-semibold text-slate-700 mb-1">Create Team</label>
                                <p className="text-sm text-slate-600">Create a new team workspace</p>
                            </div>
                            <button
                                className="px-4 py-2 border-1 border-slate-300 text-offical-black text-sm rounded-md hover:bg-slate-100 cursor-pointer"
                                onClick={() => navigate("/create-team")}
                            >
                                Create Team
                            </button>
                        </div>
                        
                        {/* User Tips Row */}
                        <div className="w-full flex flex-row justify-between items-start ">
                            <div className="flex flex-col">
                                <label className="font-semibold text-slate-700 mb-1">User Tips</label>
                                <p className="text-sm text-slate-600">View helpful tips and guidance</p>
                            </div>
                            <button
                                className="border-1 border-slate-300 text-offical-black px-4 py-2 text-sm rounded-md hover:bg-slate-100 cursor-pointer"
                                onClick={handleShowTips}
                            >
                                View User Tips
                            </button>
                        </div>
                    </div>

                    {/* Account Security Section */}
                    <div className="w-full bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-start items-start mt-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Account Security</h2>
                        
                        {/* Logout Row */}
                        <div className="w-full flex flex-row justify-between items-start">
                            <div className="flex flex-col">
                                <label className="font-semibold text-slate-700 mb-1">Logout</label>
                                <p className="text-sm text-slate-600">Sign out of your account</p>
                            </div>
                            <button
                                className="border-1 border-slate-300 text-offical-black px-4 py-2 text-sm rounded-md hover:bg-slate-100 cursor-pointer"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Popup for user tips */}
                {showTips && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50">
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