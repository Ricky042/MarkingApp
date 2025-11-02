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
    const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);




    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isSemesterDropdownOpen && !event.target.closest('.semester-dropdown-container')) {
                setIsSemesterDropdownOpen(false);
            }
            if (isStatusDropdownOpen && !event.target.closest('.status-dropdown-container')) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSemesterDropdownOpen, isStatusDropdownOpen]);

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
            return <div className="ml-72 flex justify-center items-center h-screen">Loading assignments...</div>;
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
            <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
                <Sidebar activeTab={1} />
            </aside>

            {/* Main Content */}
            <div className="ml-72 flex-1 flex flex-col bg-white">
                <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
                <MenuItem 
                    menuOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                />
                
                <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : "mr-0"}`}>
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
                        <div className="relative w-52 semester-dropdown-container">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSemesterDropdownOpen(!isSemesterDropdownOpen);
                                    setIsStatusDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                            >
                                <span className={`text-sm font-medium ${selectedSemester ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {selectedSemester || "Select semester"}
                                </span>
                                <img 
                                    src="/AssignmentIcon/chevron-down.svg" 
                                    alt="Dropdown arrow" 
                                    className={`w-4 h-4 transition-transform duration-200 ${isSemesterDropdownOpen ? 'transform rotate-180' : ''}`}
                                />
                            </button>
                            
                            {isSemesterDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                                    {[
                                        { value: "", label: "Select semester", disabled: true },
                                        { value: "All Semesters", label: "All Semesters" },
                                        { value: "Semester 1", label: "Semester 1" },
                                        { value: "Semester 2", label: "Semester 2" }
                                    ].map((option) => {
                                        const isSelected = selectedSemester === option.value;
                                        return (
                                            <button
                                                key={option.value || "default"}
                                                type="button"
                                                disabled={option.disabled}
                                                onClick={() => {
                                                    if (!option.disabled) {
                                                        setSelectedSemester(option.value);
                                                        setIsSemesterDropdownOpen(false);
                                                    }
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                                    option.disabled 
                                                        ? 'text-slate-400 cursor-not-allowed' 
                                                        : isSelected 
                                                            ? 'bg-slate-100 text-slate-900 font-semibold' 
                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{option.label}</span>
                                                    {isSelected && !option.disabled && (
                                                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative w-52 status-dropdown-container">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                    setIsSemesterDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                            >
                                <span className={`text-sm font-medium ${selectedStatus ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {selectedStatus || "Select status"}
                                </span>
                                <img 
                                    src="/AssignmentIcon/chevron-down.svg" 
                                    alt="Dropdown arrow" 
                                    className={`w-4 h-4 transition-transform duration-200 ${isStatusDropdownOpen ? 'transform rotate-180' : ''}`}
                                />
                            </button>
                            
                            {isStatusDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                                    {[
                                        { value: "", label: "Select status", disabled: true },
                                        { value: "All Status", label: "All Status" },
                                        { value: "MARKING", label: "MARKING" },
                                        { value: "COMPLETED", label: "COMPLETED" }
                                    ].map((option) => {
                                        const isSelected = selectedStatus === option.value;
                                        return (
                                            <button
                                                key={option.value || "default"}
                                                type="button"
                                                disabled={option.disabled}
                                                onClick={() => {
                                                    if (!option.disabled) {
                                                        setSelectedStatus(option.value);
                                                        setIsStatusDropdownOpen(false);
                                                    }
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                                    option.disabled 
                                                        ? 'text-slate-400 cursor-not-allowed' 
                                                        : isSelected 
                                                            ? 'bg-slate-100 text-slate-900 font-semibold' 
                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{option.label}</span>
                                                    {isSelected && !option.disabled && (
                                                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="flex max-w-72 ml-auto">
                            <div className="w-full min-h-8 px-3 py-2.5 bg-white border border-slate-300 rounded-lg flex items-center gap-1.5">
                                <img
                                    src="/navBarIcon/navBar_searchIcon.svg"
                                    alt="Search Icon"
                                    className="h-3 w-3"
                                />
                                <input
                                    className="bg-transparent outline-none placeholder-slate-500 text-sm w-full"
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
