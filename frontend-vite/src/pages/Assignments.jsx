import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
    const [selectedStatus, setSelectedStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState(""); // Added searchQuery state
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");

        try {
            const res = await api.get(`/team/${teamId}/role`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserRole(res.data.role);
        } catch (err) {
            console.error("Error fetching user role:", err);
            }
        };

        fetchUserRole();// Fetch current user's role in the team


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
                        markers: ms.map(m => ({ id: m.id, name: m.name })), 
                        markersAlreadyMarked: data.markersAlreadyMarked ?? 0, // Default to 0 if undefined
                    };
                }
                return { ...a, markers: [], markersAlreadyMarked: 0 };
            });

            setAssignments(withMarkers);
            } catch (err) {
            console.error("Error fetching assignments:", err);
            } finally {
            setIsLoading(false);
            }
        };

        fetchAssignments();
        }, [teamId, navigate]);

        const markComplete = async (assignmentId) => {
    try {
      await api.post(`/assignments/${assignmentId}/mark/complete`);
      // refresh assignments after update
      const res = await api.get(`/teams/${teamId}/assignments`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Error updating completion:", err);
    }
  };
        // Debug: Log assignments to verify data
        assignments.forEach(a => {
            console.log(`Assignment: ${a.course_name}`);
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
    // Semester filter
    const semesterMatch =
      !selectedSemester ||
      selectedSemester === "All Semesters" ||
      `Semester ${assignment.semester}` === selectedSemester;

    // Status filter (still works for both tutor/admin)
    const statusMatch =
      !selectedStatus ||
      selectedStatus === "All Status" ||
      `${assignment.status}` === selectedStatus;

    // --- Search logic differs by role ---
    let searchMatch = false;
    if (currentUserRole === "tutor") {
      const myStatus = assignment.myCompleted ? "Complete" : "Marking";
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
        <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
            <Sidebar activeTab={1}/>
        </aside>

        <div className="ml-56 flex-1 flex flex-col bg-white">
            <Navbar onBurgerClick={() => setMenuOpen(v => !v)}/>
            <MenuItem 
                menuOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
            />
            <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-white ${menuOpen ? "ml-56" : "mr-0"}`}>
                <div className="flex justify-between items-center mb-0 px-6 py-6">
                    <div className="text-offical-black text-3xl font-bold pt-4 pb-4">
                        Assignments
                    </div>
                    <button 
                        className="px-4 py-2 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-slate-800 transition" 
                        onClick={() => navigate(`/team/${teamId}/assignments/new`)}
                    >
                        <span className="text-white text-lg font-base">
                        + New Assignment
                        </span>
                    </button>
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
                    {/* Status filter is visually present but disabled in logic for now */}
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
                            <option value="COMPLETED">COMLETED</option>
                        </select>
                    </div>
                    {/* Search */}
                    <div className="flex max-w-72 ml-auto">
                        <div className="w-full min-h-8 px-3 py-1.5 bg-neutral-100 rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                        <img
                            src="/navBarIcon/navBar_searchIcon.svg"
                            alt="Menu Icon"
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

                <div className="flex flex-wrap gap-4 px-6 py-4">
                {/* Mapping over 'filteredAssignments' now */}
                {filteredAssignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        onClick={() => handleNav(`assignments/${assignment.id}`)} // Fixed navigation path
                        className="px-6 pt-3.5 pb-2 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex flex-col justify-start items-start gap-1.5"
                        >

                        {/* 'semester' from the API */}
                        <div className="w-60 inline-flex justify-between">
                            Semester {assignment.semester}
                            <div
  className={`w-20 h-7 px-4 py-2 rounded-[50px] outline outline-1 outline-offset-[-1px]
  ${assignment.status === "Completed"
    ? "bg-green-100 outline-green-300"
    : "bg-yellow-100 outline-yellow-300"} 
  inline-flex justify-center items-center gap-2.5`}
>
  <div className="text-xs font-medium">
    {currentUserRole === "admin"
      ? assignment.status
      : assignment.myCompleted
        ? "Completed"
        : "Marking"}
  </div>
</div>
                   
                        </div>
                        

                        {/* Using 'course_name' instead of 'title' */}
                        <div className="w-36 flex flex-col items-start gap-8">
                            <div className="w-48 text-offical-black text-2xl font-medium font-['Inter'] leading-7 text-left">{assignment.course_name}</div>
                        </div>
                        
                        {/* Using 'course_code' from the API */}
                        <div className="text-sm text-gray-500 mb-2">
                            {assignment.course_code}
                        </div>
                        
                        <div className="justify-start text-black text-xs font-normal font-['Inter'] leading-7">
                            {assignment.markersAlreadyMarked || 0} / {assignment.markers?.length || 0} 
                            ({((assignment.markersAlreadyMarked || 0) / (assignment.markers?.length || 0) * 100).toFixed(0)}%)
                        </div>

                        <div className="flex-grow"></div> {/* Pushes due date to the bottom */}
                        
                        <div className="mt-4 text-xs text-gray-400">
                            {/* Formatting the due date for better readability */}
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>

                        {/* Delete button outside the clickable area */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // stop click bubbling to card
                                handleDelete(assignment.id);
                            }}
                            className="mt-2 self-end px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
                        >
                        Delete
                        </button>
                    </div>
                ))}
                </div>
            </div>
        </div>
    </div>
    )};