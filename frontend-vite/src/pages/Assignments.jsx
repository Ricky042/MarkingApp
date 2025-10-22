import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import AssignmentCard from "../components/AssignmentCard";

export default function Assignments() {
    const { teamId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);




    useEffect(() => {
        const fetchUserRole = async () => { // Fetch current user's role in the team
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");

        try {
            const res = await api.get(`/team/${teamId}/role`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserRole(res.data.role);
        setCurrentUserId(res.data.userId);
        } catch (err) {
            console.error("Error fetching user role:", err);
            }
        };

        fetchUserRole();

    }, [teamId, navigate]);

    useEffect(() => {
        const fetchAssignments = async () => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");

            setIsLoading(true);
            try {
            const listRes = await api.get(`/team/${teamId}/assignments`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const base = (listRes.data.assignments || []).map(a => ({
                ...a,
                markers: [],
                markersAlreadyMarked: 0,
                myCompleted: false,
            }));

            const settled = await Promise.allSettled(
                base.map(a =>
                api.get(`/team/${teamId}/assignments/${a.id}/details`, {
                    headers: { Authorization: `Bearer ${token}` },
                    
                })
                )
            );

        const withMarkers = base.map((a, idx) => {
        const r = settled[idx];
        if (r.status === "fulfilled") {
          const data = r.value?.data || {};
          const ms = data.markers || [];

          return {
            ...a,
            // Populate markers and myCompleted based on fetched data
            markers: ms.map(m => ({ id: m.id, name: m.name, completed: m.completed ?? false })),
            markersAlreadyMarked: data.markersAlreadyMarked ?? 0,
            // Use personalComplete from backend to set myCompleted
            myCompleted: data.currentUser?.personalComplete ?? false,
          };
        }   return { ...a, markers: [], markersAlreadyMarked: 0, myCompleted: false };
      });


        
        

            setAssignments(withMarkers);
            } catch (err) {
                console.error("Error fetching assignments:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssignments();
        }, [teamId, navigate, currentUserId]);

        const markComplete = async (assignmentId, paperId, scores) => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");

            try {
            const res = await api.post(
            `/assignments/${assignmentId}/mark`,
            { paperId, scores },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local state to reflect the marking completion
        setAssignments(prev =>
            prev.map(a => {
                if (a.id !== assignmentId) return a;

                const updatedMarkers = a.markers.map(m =>
                m.id === currentUserId ? { ...m, completed: true } : m
            );
            const updatedCompletedCount = Math.min(
            (a.markersAlreadyMarked || 0) + 1,
            a.markers.length
        );

            return {
                ...a,
                myCompleted: true,
                markers: updatedMarkers,
                markersAlreadyMarked: updatedCompletedCount,
                status: res.data.status || a.status,
            };
            })
        );
        } catch (err) {
            console.error("Error submitting marks:", err);
        }
    };

        // Debug: Log assignments to verify data
        assignments.forEach(a => {
            console.log(`Assignment: ${a.course_name}`);
            console.log("Completed by current user:", a.myCompleted);
            console.log("Markers:", a.markers?.map(m => m.name).join(", ") || "No markers");
            console.log("Markers Already Marked:", a.markersAlreadyMarked);
            console.log("Status:", a.status);
            console.log("assignment", a);
        });

        // Implemented frontend filtering
        /*
        const filteredAssignments = useMemo(() => {
            return assignments.filter(assignment => {
                // Semester filter logic
                const semesterMatch = !selectedSemester || 
                    selectedSemester === "All Semesters" || 
                    `Semester ${assignment.semester}` === selectedSemester;
                const statusMatch = !selectedStatus || 
                    selectedStatus === "All Status" || 
                    `${assignment.status}` === selectedStatus;

                // Search query logic (now matches course_name and course_code)
                const searchMatch =
                    assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase());

                return semesterMatch && statusMatch && searchMatch;
            });
        }, [assignments, selectedSemester, selectedStatus, searchQuery]);*/
        // --- Filtering logic ---
        const filteredAssignments = useMemo(() => {
            return assignments.filter((assignment) => {
            const semesterMatch =
            !selectedSemester ||
            selectedSemester === "All Semesters" ||
            `Semester ${assignment.semester}` === selectedSemester;

            let statusMatch = true;
            if (selectedStatus && selectedStatus !== "All Status") {
                if (currentUserRole === "admin") {
                // Admin sees backend assignment.status
                statusMatch = assignment.status?.toUpperCase() === selectedStatus.toUpperCase();
            } else if (currentUserRole === "tutor") {
                // Tutor sees own marking progress
                const myStatus = assignment.myCompleted ? "COMPLETED" : "MARKING";
                statusMatch = myStatus === selectedStatus.toUpperCase();
            }
        }

            let searchMatch = false;
            if (currentUserRole === "tutor") {
                const myStatus = assignment.myCompleted ? "Completed" : "Marking";
                searchMatch =
                    assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    myStatus.toLowerCase().includes(searchQuery.toLowerCase());
                } else if (currentUserRole === "admin") {
                searchMatch =
                    assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    assignment.status.toLowerCase().includes(searchQuery.toLowerCase());
            }

                return semesterMatch && statusMatch && searchMatch;
            });
        }, [assignments, selectedSemester, selectedStatus, searchQuery, currentUserRole]);



        if (isLoading) {
            return <div className="ml-56 flex justify-center items-center h-screen">Loading assignments...</div>;
        }

        const handleNav = (path) => {
            navigate(`/team/${teamId}/${path}`);
        };

        const handleDelete = async (assignmentId) => {
            if (!window.confirm("Are you sure you want to delete this assignment?")) return;

        const token = localStorage.getItem("token");
        try {
            await api.delete(`/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
            });
        // Remove the deleted assignment from state
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        } catch (err) {
            console.error("Failed to delete assignment:", err);
            alert("Error deleting assignment.");
            }
        };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
                <Sidebar activeTab={1} />
            </aside>

            {/* Main Content */}
            <div className="ml-56 flex-1 flex flex-col bg-white">
                <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
                <MenuItem 
                    menuOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                />
                
                <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : "mr-0"}`}>
                    {/* Header & New Assignment Button */}
                    <div className="flex justify-between items-center mb-0 px-6 py-6">
                        <div className="text-offical-black text-3xl font-bold pt-4 pb-4">
                            Assignments
                        </div>
                        <button 
                            className="px-4 py-4 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-[#0E796B] transition" 
                            onClick={() => navigate(`/team/${teamId}/assignments/new`)}
                        >
                            <span className="text-white text-lg font-base">
                                + New Assignment
                            </span>
                        </button>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex items-center gap-4 px-6 mb-4 justify-between">
                        {/* Semester Filter */}
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

                        {/* Status Filter */}
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
                                <option value="MARKING">MARKING</option>
                                <option value="COMPLETED">COMPLETED</option>
                            </select>
                        </div>

                        {/* Search Bar */}
                        <div className="flex max-w-72 ml-auto">
                            <div className="w-full min-h-8 px-3 py-2 bg-white rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                                <img
                                    src="/navBarIcon/navBar_searchIcon.svg"
                                    alt="Search Icon"
                                    className="h-3 w-3"
                                />
                                <input
                                    className="bg-transparent outline-none placeholder-zinc-500 text-sm w-full"
                                    placeholder="Search assignments"
                                    aria-label="Search assignments"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assignments Grid */}
                    <div className="flex flex-wrap gap-4 px-6 py-4">
                        {filteredAssignments.map((assignment) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                onNavigate={handleNav}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

};
