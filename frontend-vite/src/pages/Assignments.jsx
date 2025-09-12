import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/navBar";
import MenuItem from "../components/NavbarMenu";

export default function Assignments() {
    const { teamId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false); // navbar menu state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await api.get(`/teams/${teamId}/assignments`);
                setAssignments(response.data);
            } catch (error) {
                console.error("Error fetching assignments:", error);
                navigate("/error");
            } finally {
                setIsLoading(false);
            }

        };
        fetchAssignments();
    }, [teamId, navigate]);

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
                <div className="w-[1023px] inline-flex justify-between items-center">
                    <div className="flex justify-start items-center gap-1.5">
                        <div className="w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 flex justify-start items-center gap-2.5">
                            <div className="flex-1 justify-start text-slate-900 text-sm font-normal font-['Inter'] leading-normal">Select status</div>
                            <div className="w-4 h-4 relative overflow-hidden">
                                <div className="w-2 h-1 left-[4px] top-[6px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-slate-400" />
                            </div>
                        </div>
                        <div className="w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 flex justify-start items-center gap-2.5">
                            <div className="flex-1 justify-start text-slate-900 text-sm font-normal font-['Inter'] leading-normal">Select semester</div>
                            <div className="w-4 h-4 relative overflow-hidden">
                                <div className="w-2 h-1 left-[4px] top-[6px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-slate-400" />
                            </div>
                        </div>
                    </div>
                    <div className="w-72 min-h-8 px-3 py-1.5 bg-neutral-100 rounded-lg flex justify-start items-center gap-1.5">
                        <div className="text-center justify-center text-zinc-500 text-sm font-normal font-['Inter'] leading-tight tracking-tight">Search Assignments</div>
                    </div>
            </div>
            </div>
        </div>
    </div>
    )};
