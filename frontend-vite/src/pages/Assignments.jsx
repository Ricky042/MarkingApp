import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function Assignments() {
    const { teamId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false); // navbar menu state
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    useEffect(() => {
        const fetchAssignments = async () => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");
            try {
                const response = await api.get(`/team/${teamId}/assignments`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAssignments(response.data.assignments || []);
            } catch (err) {
                console.error("Error fetching assignments:", err);
                navigate("/");
            } finally {
                setIsLoading(false);
            }

        };
        fetchAssignments();
    }, [teamId, navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const handleNav = (path) => {
        navigate(`/team/${teamId}/${path}`);
    };

    return (
    <div className="flex min-h-screen">
        {/* Sidebar fixed to the left */}
        <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
            <Sidebar />
        </aside>

        {/* Main content area */}
        <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
            {/* Navbar sits on top */}
            <Navbar onBurgerClick = {() => setMenuOpen(v => !v)}/>

            <div className={`fixed inset-0 ${menuOpen ? '' : 'pointer-events-none'}`}>
                <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
                    <MenuItem 
                    menuOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    />
            </div>
            <div
            className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100
                        ${menuOpen ? "ml-64" : "mr-0"}`}
            >



                <div className="flex justify-between items-center mb-0 px-6 py-6">
                    {/* Left: Page Title */}
                    <div className="w-28 text-offical-black text-2xl font-semibold font-['Inter'] leading-7">
                        Assignments
                    </div>
                </div>

                {/* Select and Search form */}
                <div className="flex items-center gap-4 px-6 mb-4">
                    <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                        <span className="flex-1 text-zinc-600 text-sm font-normal">
                        {selectedSemester || "Select semester"}
                        </span>
                        <img
                        src="/AssignmentIcon/chevron-down.svg"
                        alt="Dropdown arrow"
                        className="w-4 h-4"
                        />
                        <select
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                        <option value="" disabled>
                            Select semester
                        </option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        </select>
                    </div>

                    <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                        <span className="flex-1 text-zinc-600 text-sm font-normal">
                        {selectedStatus || "Select status"}
                        </span>
                        <img
                        src="/AssignmentIcon/chevron-down.svg"
                        alt="Dropdown arrow"
                        className="w-4 h-4"
                        />
                        <select
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                        <option value="" disabled>
                            Select status
                        </option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>


                <div className="flex gap-4 px-6 py-4">
                {assignments.map((assignment) => (
                    <button
                        key={assignment.id}
                        onClick={() => handleNav(`assignment/${assignment.id}`)}
                        className="px-6 py-4 bg-white border border-slate-200 rounded-lg shadow hover:bg-slate-50 transition-colors text-left"
                        >
                        <div className="text-lg font-semibold mb-2">{assignment.title}</div>
                        <div className="text-sm text-gray-500 mb-1">
                            {assignment.semester} &nbsp;|&nbsp; {assignment.status}
                        </div>
                        <div className="text-sm text-gray-700">
                            {assignment.gradedCount} / {assignment.totalCount} graded ({assignment.percentage}%)
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            Due in {assignment.dueInDays} days
                        </div>
                    </button>
                ))}
                </div>
            </div>
        </div>
    </div>
    )};