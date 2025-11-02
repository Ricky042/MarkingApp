import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import { Calendar } from "../components/ui/calendar";
import { Button } from "@/components/ui/button";
import AssignmentRow from "../components/AssignmentRow";
import DeadlineCard from "../components/DeadlineCard";
import DashboardCard from "../components/DashboardCard";
import AreaChartComponent from "../components/AreaChartComponent";

// --- SVG Icon Components for the Modal ---

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



// --- Invite Modal Component (Fully Updated) ---

function InviteModal({ isOpen, onClose, teamId }) {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  
  // New state to hold the results from the backend
  const [inviteResults, setInviteResults] = useState([]);

  // Reset the entire state when the modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => { // Delay reset to allow for closing animation
        setEmails([]);
        setCurrentEmail("");
        setMessage("");
        setFeedback({ type: "", message: "" });
        setIsSending(false);
        setInviteResults([]);
      }, 300);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || !currentEmail.trim()) return;
    e.preventDefault();
    const newEmail = currentEmail.trim().toLowerCase();
    if (/\S+@\S+\.\S+/.test(newEmail) && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  // --- handleSendInvites FUNCTION ---
  const handleSendInvites = async () => {
    if (emails.length === 0) {
      setFeedback({ type: "error", message: "Please add at least one email." });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFeedback({ type: "error", message: "Authentication error. Please log in again." });
      return;
    }
    
    setIsSending(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await api.post(
        `/team/${teamId}/invite`,
        {
          emails: emails,
          message: message, // Send the optional message
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // Add the token for authentication
        }
      );
      
      // On success, store the detailed results to display them
      setInviteResults(res.data.results || []);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
      setFeedback({ type: "error", message: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  // Helper to render the status of each invite
  const renderStatus = (status) => {
    switch (status) {
      case 'sent':
        return <span className="text-green-600 font-medium">Sent</span>;
      case 'already_member':
        return <span className="text-yellow-600 font-medium">Already a member</span>;
      case 'already_invited':
        return <span className="text-blue-600 font-medium">Already invited</span>;
      default:
        return <span className="text-gray-500">{status}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-lg flex flex-col gap-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-slate-900 text-lg font-semibold">
            {inviteResults.length > 0 ? 'Invitation Results' : 'Invite Markers'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>

        {/* --- DYNAMIC CONTENT: Show form OR results --- */}
        {inviteResults.length > 0 ? (
          // --- RESULTS VIEW ---
          <div>
            <ul className="flex flex-col gap-2 my-4">
              {inviteResults.map(result => (
                <li key={result.email} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-800">{result.email}</span>
                  {renderStatus(result.status)}
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 shadow-sm text-center text-neutral-900 text-sm font-medium hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
        ) : (
          // --- INVITATION FORM VIEW ---
          <>
            <div className="self-stretch min-h-10 p-2 bg-neutral-100 rounded-lg flex flex-wrap items-center gap-2 border border-slate-200">
              {emails.map((email) => (
                <div key={email} className="bg-white rounded-full flex items-center gap-1.5 pl-3 pr-1.5 py-1 border border-slate-200">
                  <span className="text-slate-900 text-sm font-medium">{email}</span>
                  <button onClick={() => removeEmail(email)} className="bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center text-slate-600 hover:bg-slate-300">&times;</button>
                </div>
              ))}
              <input type="email" value={currentEmail} onChange={(e) => setCurrentEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder={emails.length === 0 ? "Enter email and press Enter" : ""} className="flex-1 bg-transparent outline-none p-1 text-sm"/>
            </div>

            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add an optional message..." className="self-stretch flex-1 p-3 bg-white rounded-md border border-slate-300 focus:ring-2 focus:ring-slate-400 focus:outline-none text-sm" rows={4}/>
            
            {feedback.message && (<div className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</div>)}
            
            <div className="self-stretch flex justify-end items-start gap-2.5">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 shadow-sm text-center text-neutral-900 text-sm font-medium hover:bg-neutral-50">Cancel</button>
              <button onClick={handleSendInvites} disabled={isSending} className="flex-1 h-10 px-4 py-2 bg-slate-900 rounded-md shadow-sm text-center text-white text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400">
                {isSending ? "Sending..." : `Send Invite${emails.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Main Team Dashboard Component ---

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- State for user role (admin or tutor) ---
  const [userRole, setUserRole] = useState(null);
  // --- State for dashboard data ---
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  
  // --- State for the invite modal ---
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalAssignments: 0,
    activeMarkers: 0,
    submissionsGraded: 0,
    flagsOpen: 0,
    totalTeamMembers: 0
  });

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/team/${teamId}/markers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamMembers(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch team members:", err);
      // Use mock data on failure
      return [
        { id: 1, username: 'user1@example.com' },
        { id: 2, username: 'user2@example.com' }
      ];
    }
  };

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch the user's role in the team
      const res = await api.get(`/team/${teamId}/role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.role) {
        setUserRole(res.data.role);
        console.log("User role:", res.data.role);
        return res.data.role;
      }
      
      return 'tutor'; // default to tutor if no role found
      
    } catch (err) {
      console.error("Failed to fetch user role:", err);
      return 'admin'; // default to admin on error
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/team/${teamId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    
      const mockStats = {
        totalAssignments: 12,
        activeMarkers: 8,
        submissionsGraded: 156,
        flagsOpen: 3,
        totalTeamMembers: teamMembers.length || 10
      };
      setDashboardStats(mockStats);
      return mockStats;
    }
  };

  const fetchRecentAssignments = async () => {
  try {
    const token = localStorage.getItem("token");
    //console.log("Fetching recent assignments for team:", teamId);
    //console.log("Token exists:", !!token);
    
    const res = await api.get(`/team/${teamId}/recent-assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    //console.log("API Response:", res.data);
    //console.log("Assignments data:", res.data.assignments);
    
    setRecentAssignments(res.data.assignments);
    return res.data.assignments;
  } catch (err) {
    console.error("Failed to fetch recent assignments:", err);
    console.error("Error details:", err.response?.data);
    
    // if the API call fails, use mock data
    const mockAssignments = [
      {
        id: 1,
        course_code: "PSY101",
        course_name: "Psychology Report",
        status: "Moderating",
        progress: 70,
        flags: 2,
        total_markers: 5,
        completed_markers: 3
      },
      {
        id: 2,
        course_code: "BIO202",
        course_name: "Biology Lab Report",
        status: "Grading",
        progress: 45,
        flags: 1,
        total_markers: 4,
        completed_markers: 2
      }
    ];
    setRecentAssignments(mockAssignments);
    return mockAssignments;
  }
};
  
const fetchUpcomingDeadlines = async () => {
  try {
    const token = localStorage.getItem("token");
  
    const res = await api.get(`/team/${teamId}/upcoming-deadlines`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data && res.data.deadlines) {
      setUpcomingDeadlines(res.data.deadlines);
        return res.data.deadlines;
      }

    } catch (err) {
      console.error("Failed to fetch upcoming deadlines:", err);
    
      // if error occurs, use mock data
      const mockDeadlines = [
        {
          id: 1,
          course_code: "PSY101",
          course_name: "Psychology Report",
          due_in: "Due in 2 days",
          last_updated: new Date().toISOString(),
          status: "Moderating"
        }
      ];
      setUpcomingDeadlines(mockDeadlines);
    return mockDeadlines;
    }
  };
  
  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
      
        await api.get(`/team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Team access verified, loading mock data...");
        
      } catch (err) {
        console.error("Failed to verify team access:", err);
      }
      
      // Load all dashboard data (using mock data on failure)
      try {
        await fetchTeamMembers();
        await fetchDashboardStats();
        await fetchRecentAssignments();
        await fetchUpcomingDeadlines();
        await fetchUserRole(); 
      } catch (err) {
        console.error("Error loading mock data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, navigate]);





  if (isLoading) return <div>Loading...</div>;

  return (
    <> {/* Use a fragment to render modal outside the main layout div */}
      <div className="flex flex-row min-h-screen">
        <div className="flex flex-row min-h-screen w-72">
           <div className=" fixed h-screen w-72 border-r border-slate-200 z-50">
             <Sidebar activeTab={0} />
           </div>
        </div>
        <div className="flex-1 flex flex-col bg-neutral-00">
          <Navbar onBurgerClick = {() => setMenuOpen(v => !v)}/>
          {/* <MenuItem 
            menuOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
          /> */}

          <main className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : ""}`}>
            {/* Page Header Section */}
            <div className="flex justify-between items-center mb-0 px-6 py-6">
              <h1 className="text-offical-black text-3xl font-bold pt-4 pb-4">
                Dashboard
              </h1>
              <button 
                className="px-4 py-4 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-[#0E796B] transition" 
                onClick={() => navigate(`/team/${teamId}/assignments/new`)}
              >
                <span className="text-white text-lg font-base">
                  + New Assignment
                </span>
              </button>
            </div>

            {/* Page Content */}
            <div className="pl-6 pb-6 flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              {/* Left wrapper: Boxes 1-4 + wide box */}
              <div className="flex-1 flex flex-col gap-6 min-w-0 lg:w-3/4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DashboardCard 
                    title="Total Assignments"
                    value={dashboardStats.totalAssignments.toString()}
                  />
                  <DashboardCard 
                    title="Markers Active"
                    value={`${dashboardStats.activeMarkers}/${dashboardStats.totalTeamMembers || teamMembers.length}`}
                  />
                  <DashboardCard 
                    title="Submissions Graded"
                    value={dashboardStats.submissionsGraded.toString()}
                  />
                  <DashboardCard 
                    title="Flags Open"
                    value={dashboardStats.flagsOpen.toString()}
                  />
                </div>

                {/* Wide box under the first 4 boxes */}
                {/* Recent Assignments */}
                <div className="w-full flex flex-col bg-white rounded-lg h-fit pt-6 pb-7 pl-8 pr-8 gap-4">
                  <h2 className="text-official-black text-lg font-semibold mb-4 h-fit">
                    Recent Assignments
                  </h2>
                  {recentAssignments.length > 0 ? (
                    recentAssignments.map((assignment, index) => (
                      <AssignmentRow
                        key={assignment.id || index}
                        title={assignment.course_name}
                        updatedText="Last updated 1:30 today" 
                        labelText={assignment.status}
                        completedText={`${assignment.completed_markers || 0}/${assignment.total_markers || 0}`}
                        percentText={`${assignment.progress || 0}%`}
                        progressValue={assignment.progress || 0}
                        flagsText={`${assignment.flags || 0} Flags`}
                        onViewDetails={() => navigate(`/team/${teamId}/assignments/${assignment.id}`)}
                      />
                    ))
                  ) : (
                    // No assignments found message
                    <div className="text-center py-4 text-gray-500">
                      No assignments found
                    </div>
                  )}
                </div>
                
                {/* Second Wide box - Area Chart */}
                {userRole === 'admin' && (
                  <div className="w-full bg-white rounded-lg pt-6 pb-7 pl-8 pr-8">
                    <div className="">
                      <h3 className="text-lg font-semibold text-offical-black">Assignment Submissions</h3>
                      <p className="text-sm text-zinc-400">Showing total submissions for the last 6 months</p>
                    </div>
                    <AreaChartComponent />
                  </div>
                )}
              
              </div>

              {/* Right wrapper: Stacked boxes */}
              <div className="flex flex-col gap-6 w-full lg:w-1/4 flex-shrink-0">
                <div className="w-full bg-white rounded-lg p-6">
                  <h4 className="text-[var(--deakinTeal)] text-xl font-semibold mb-4">
                    Quick Actions
                  </h4>
                  <div className="flex flex-col gap-2">
                    {/* Invite Markers */}
                    <button 
                      onClick={() => setIsInviteModalOpen(true)}
                      className="inline-flex justify-start items-center gap-2 cursor-pointer hover:bg-[#f8f8f8] rounded-lg px-4 py-2 text-sm font-medium text-left"
                    >
                      <img src="/Dashboard/icon/layout.svg" alt="Invite" className="w-4 h-4" />
                      <span className="text-offical-black text-base font-medium">Invite Markers</span>
                    </button>

                    {/* Export Reports */}
                    <button 
                      className="inline-flex justify-start items-center cursor-pointer gap-2 hover:bg-[#f8f8f8] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => navigate(`/team/${teamId}/reports`)}
                    >
                      <img src="/Dashboard/icon/users.svg" alt="Export Reports" className="w-4 h-4" />
                      <div className="text-offical-black text-base font-medium">
                        Export Reports
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* The calendar */}
                <Calendar className="w-full rounded-lg p-5"/>
                
                {/* The upcoming deadline */}
                <div className="w-full p-5 bg-white rounded-lg">
                  <div className="text-[var(--deakinTeal)] font-semibold text-lg mb-4">Upcoming Deadlines</div>
  
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline, index) => (
                      <DeadlineCard 
                        key={deadline.id || index}
                        dueIn={deadline.due_in}
                        title={deadline.course_name}
                        lastUpdated={deadline.last_updated}
                        assignmentId={deadline.id}
                        onClick={(assignmentId) => navigate(`/team/${teamId}/assignments/${assignmentId}`)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No upcoming deadlines
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* --- Render the modal here --- */}
      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={teamId}
      />
    </>
  );
}