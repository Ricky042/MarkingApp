import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

// --- SVG Icon Components for the Modal ---

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- Invite Modal Component ---

function InviteModal({ isOpen, onClose, teamId }) {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmails([]);
      setCurrentEmail("");
      setMessage("");
      setFeedback({ type: "", message: "" });
      setIsSending(false);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || !currentEmail.trim()) return;
    
    e.preventDefault();
    const newEmail = currentEmail.trim();

    // Basic email validation & prevent duplicates
    if (/\S+@\S+\.\S+/.test(newEmail) && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      setFeedback({ type: "error", message: "Please add at least one email." });
      return;
    }
    
    setIsSending(true);
    setFeedback({ type: "", message: "" });

    try {
      await api.post(`/team/${teamId}/invite`, {
        emails: emails,
        message: message,
      });

      setFeedback({ type: "success", message: "Invitations sent successfully!" });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
      setFeedback({ type: "error", message: errorMessage });
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-lg flex flex-col gap-4 p-5"
        onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-slate-900 text-lg font-semibold">Invite Markers</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>

        {/* Email Input Area */}
        <div className="self-stretch min-h-10 p-2 bg-neutral-100 rounded-lg flex flex-wrap items-center gap-2 border border-slate-200">
          {emails.map((email) => (
            <div key={email} className="bg-white rounded-full flex items-center gap-1.5 pl-3 pr-1.5 py-1 border border-slate-200">
              <span className="text-slate-900 text-sm font-medium">{email}</span>
              <button
                onClick={() => removeEmail(email)}
                className="bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center text-slate-600 hover:bg-slate-300"
              >
                &times;
              </button>
            </div>
          ))}
          <input
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={emails.length === 0 ? "Enter one or more emails" : ""}
            className="flex-1 bg-transparent outline-none p-1 text-sm"
          />
        </div>

        {/* Message Textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add an optional message..."
          className="self-stretch flex-1 p-3 bg-white rounded-md border border-slate-300 focus:ring-2 focus:ring-slate-400 focus:outline-none text-sm"
          rows={4}
        />

        {/* Feedback Message */}
        {feedback.message && (
          <div className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="self-stretch flex justify-end items-start gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 shadow-sm text-center text-neutral-900 text-sm font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvites}
            disabled={isSending}
            className="flex-1 h-10 px-4 py-2 bg-slate-900 rounded-md shadow-sm text-center text-white text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isSending ? "Sending..." : `Send Invite${emails.length > 1 ? 's' : ''}`}
          </button>
        </div>
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
  
  // --- State for the invite modal ---
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        // Your existing API call to fetch dashboard data would go here
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, navigate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <> {/* Use a fragment to render modal outside the main layout div */}
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-40">
          <Sidebar />
        </aside>

        <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
          <Navbar onBurgerClick = {() => setMenuOpen(v => !v)}/>

          <div className={`fixed inset-0 z-30 ${menuOpen ? '' : 'pointer-events-none'}`}>
            <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
            <MenuItem 
              menuOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
            />
          </div>

          <main className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-64" : ""}`}>
            {/* Page Header Section */}
            <div className="flex justify-between items-center mb-0 px-6 py-6">
              <h1 className="text-offical-black text-2xl font-semibold">
                Dashboard
              </h1>
              <button 
                className="px-4 py-2 bg-slate-900 rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-slate-800 transition" 
                onClick={() => navigate(`/team/${teamId}/assignments/new`)}
              >
                <span className="text-white text-sm font-medium">
                  + New Assignment
                </span>
              </button>
            </div>

            {/* Page Content */}
            <div className="px-6 pb-6 flex-1 flex gap-6">
              {/* Left wrapper: Boxes 1-4 + wide box */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                  {/* Boxes 1-4 */}
                  <div className="w-full bg-white rounded-lg outline outline-1 outline-slate-300 px-6 pt-3.5 pb-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                            <div className="self-stretch justify-start text-zinc-600 text-xs font-semibold font-['Inter'] leading-7">Total Assignments</div>
                        </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch justify-start text-offical-black text-2xl font-medium font-['Inter'] leading-7">48</div>
                    </div>
                  </div>
                  <div className="w-full bg-white rounded-lg outline outline-1 outline-slate-300 px-6 pt-3.5 pb-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                            <div className="self-stretch justify-start text-zinc-600 text-xs font-semibold font-['Inter'] leading-7">Markers Active</div>
                        </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch justify-start text-offical-black text-2xl font-medium font-['Inter'] leading-7">12/18</div>
                    </div>
                  </div>
                  <div className="w-full bg-white rounded-lg outline outline-1 outline-slate-300 px-6 pt-3.5 pb-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                            <div className="self-stretch justify-start text-zinc-600 text-xs font-semibold font-['Inter'] leading-7">Submissions Graded</div>
                        </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch justify-start text-offical-black text-2xl font-medium font-['Inter'] leading-7">342/450</div>
                    </div>
                  </div>
                  <div className="w-full bg-white rounded-lg outline outline-1 outline-slate-300 px-6 pt-3.5 pb-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                            <div className="self-stretch justify-start text-zinc-600 text-xs font-semibold font-['Inter'] leading-7">Flags Open</div>
                        </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        <div className="self-stretch justify-start text-offical-black text-2xl font-medium font-['Inter'] leading-7">3</div>
                    </div>
                  </div>
                </div>

                {/* Wide box under the first 4 boxes */}
                <div className="w-full h-72 bg-white rounded-lg border border-slate-200"></div>
                {/* Second Wide box */}
                <div className="w-full h-72 bg-white rounded-lg border border-slate-200"></div>
              </div>

              {/* Right wrapper: Stacked boxes */}
              <div className="flex flex-col gap-6 w-56">
                <div className="w-full bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="text-slate-900 text-base font-semibold mb-4">
                    Quick Actions
                  </h4>
                  {/* *** FIX 1: Corrected the layout and nesting of action items *** */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Invite Markers */}
                    <button 
                      onClick={() => setIsInviteModalOpen(true)}
                      className="inline-flex justify-start items-center gap-2 cursor-pointer hover:opacity-80 text-sm font-medium text-left"
                    >
                      <img src="/Dashboard/icon/layout.svg" alt="Invite" className="w-4 h-4" />
                      <span>Invite Markers</span>
                    </button>

                    {/* Email Markers */}
                    <div className="inline-flex justify-start items-center gap-2">
                      <img src="/Dashboard/icon/layout.svg" alt="Email Markers" className="w-4 h-4" />
                      <div className="text-offical-black text-sm font-medium">
                        Email Markers
                      </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="inline-flex justify-start items-center gap-2">
                      <img src="/Dashboard/icon/clipboard-signature.svg" alt="Upcoming Deadlines" className="w-4 h-4" />
                      <div className="text-offical-black text-sm font-medium">
                        Upcoming Deadlines
                      </div>
                    </div>

                    {/* Export Reports */}
                    <div className="inline-flex justify-start items-center gap-2">
                      <img src="/Dashboard/icon/users.svg" alt="Export Reports" className="w-4 h-4" />
                      <div className="text-offical-black text-sm font-medium">
                        Export Reports
                      </div>
                    </div>

                  </div>
                </div>
                <div className="w-full h-64 bg-white rounded-lg border border-slate-200"></div>
                <div className="w-full h-64 bg-white rounded-lg border border-slate-200"></div>
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