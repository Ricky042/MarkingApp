import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";

export default function AssignmentMakers() {
    const { teamId, assignmentId } = useParams();
    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
                <Sidebar />
            </aside>
            <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
                <Navbar />
                <div>
                    Assignment Makers Page - Team ID: {teamId}, Assignment ID: {assignmentId}
                </div>
            </div>
            
        </div>
        
        );
}
