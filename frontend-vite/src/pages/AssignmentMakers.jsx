import { useState, useEffect } from "react";
import api from "../utils/axios";
import { useParams, useNavigate } from "react-router-dom";


import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { set } from "date-fns/set";
import LoadingSpinner from "../components/LoadingSpinner";


export default function AssignmentMakers() {
    const { teamId, assignmentId } = useParams();
    const [assignment, setAssignment] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const response = await api.get(`/team/${teamId}/assignments/${assignmentId}/details`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data.markers;
                setAssignment(data);
                console.log(response);
            } catch (err) {
            console.error("Error fetching assignments:", err);
            setError(err.response?.data?.message || "Failed to fetch assignments");
            } finally {
            setIsLoading(false);
            }
        };

        fetchAssignments();
        }, [teamId, assignmentId]);

     if (isLoading) return <LoadingSpinner pageName="Assignment Makers" />;
     if (error) return <div className="text-red-500">Error: {error}</div>;
     if (!assignment) return <div>No assignment data available.</div>;

     console.log(assignment);

    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
                <Sidebar />
            </aside>
            <div className="ml-72 flex-1 flex flex-col bg-neutral-100">
                <Navbar />
                Assignment Makers Page - Team ID: {teamId}, Assignment ID: {assignmentId}
                {assignment.map((marker) => (
                    <div className="px-6 pt-3.5 pb-2 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex 
                        flex-col justify-start items-start gap-1.5"
                        >

                        {/* 'semester' from the API */}
                            <div className="w-60 inline-flex justify-between">
                                {marker.name}                      
                            </div>
                    </div>
                ))}
        </div>
        </div>
        );
}
