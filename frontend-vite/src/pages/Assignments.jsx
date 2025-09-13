import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react"; // UPDATED: Added useMemo
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function Assignments() {
    const { teamId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(""); // This is currently unused as status isn't in the DB

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
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssignments();
    }, [teamId, navigate]);

    // Implemented frontend filtering
    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            // Semester filter logic
            const semesterMatch = !selectedSemester || 
                                  selectedSemester === "All Semesters" || 
                                  `Semester ${assignment.semester}` === selectedSemester;
            
            // Status filter logic (currently disabled as we don't have this data)
            // const statusMatch = !selectedStatus || selectedStatus === "All Status";

            return semesterMatch; // && statusMatch;
        });
    }, [assignments, selectedSemester, selectedStatus]);


    if (isLoading) {
        return <div className="ml-56 flex justify-center items-center h-screen">Loading assignments...</div>;
    }

    const handleNav = (path) => {
        navigate(`/team/${teamId}/${path}`);
    };

    return (
    <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
            <Sidebar />
        </aside>

        <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
            <Navbar onBurgerClick={() => setMenuOpen(v => !v)}/>

            <div className={`fixed inset-0 ${menuOpen ? '' : 'pointer-events-none'}`}>
                <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
                    <MenuItem 
                    menuOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    />
            </div>
            <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-64" : "mr-0"}`}>
                <div className="flex justify-between items-center mb-0 px-6 py-6">
                    <div className="w-auto text-offical-black text-2xl font-semibold font-['Inter'] leading-7">
                        Assignments
                    </div>
                </div>

                {/* Select and Search form */}
                <div className="flex items-center gap-4 px-6 mb-4">
                    <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                        <span className="flex-1 text-zinc-600 text-sm font-normal">
                            {selectedSemester || "Select semester"}
                        </span>
                        <img src="/AssignmentIcon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4" />
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="" disabled>Select semester</option>
                            <option value="All Semesters">All Semesters</option>
                            <option value="Semester 1">Semester 1</option>
                            <option value="Semester 2">Semester 2</option>
                        </select>
                    </div>
                    {/* UPDATED: Status filter is visually present but disabled in logic for now */}
                    <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                        <span className="flex-1 text-zinc-600 text-sm font-normal">
                            {selectedStatus || "Select status"}
                        </span>
                        <img src="/AssignmentIcon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4" />
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="" disabled>Select status</option>
                            <option value="All Status">All Status</option>
                            <option value="In progress">In progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 px-6 py-4">
                {/* UPDATED: Mapping over 'filteredAssignments' now */}
                {filteredAssignments.map((assignment) => (
                    <button
                        key={assignment.id}
                        onClick={() => handleNav(`assignments/${assignment.id}`)} // Fixed navigation path
                        className="w-72 p-4 bg-white border border-slate-200 rounded-lg shadow hover:bg-slate-50 transition-colors text-left flex flex-col"
                        >
                        {/* UPDATED: Using 'course_name' instead of 'title' */}
                        <div className="text-lg font-semibold mb-2 truncate">{assignment.course_name}</div>
                        
                        {/* UPDATED: Using 'course_code' and 'semester' from the API */}
                        <div className="text-sm text-gray-500 mb-2">
                            {assignment.course_code} | Semester {assignment.semester}
                        </div>
                        
                        {/* UPDATED: Temporarily removed grading progress as data is not available */}
                        {/* 
                        <div className="text-sm text-gray-700">
                            {assignment.gradedCount} / {assignment.totalCount} graded ({assignment.percentage}%)
                        </div> 
                        */}
                        <div className="flex-grow"></div> {/* Pushes due date to the bottom */}
                        
                        <div className="mt-4 text-xs text-gray-400">
                            {/* UPDATED: Formatting the due date for better readability */}
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                    </button>
                ))}
                </div>
            </div>
        </div>
    </div>
    )};