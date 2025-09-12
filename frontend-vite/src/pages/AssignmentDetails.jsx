import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function AssignmentDetails() {
    const { teamId} = useParams();
    const { assignmentId } = useParams();
    const [assignment, setAssignment] = useState(null);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false); // navbar menu state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");
            try {
                const response = await api.get(`/team/${teamId}/assignments/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAssignment(response.data.assignment);
            } catch (err) {
                console.error("Error fetching assignments:", err);
                navigate("/");
            } finally {
                setIsLoading(false);
            }

        };
        fetchAssignments();
    }, [teamId, assignmentId, navigate]);

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
                        {assignment.title}
                    </div>
                </div>  
            </div>
          </div>
        </div>
    );
}