import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import MarkerCard from "../components/MarkerCard";
import LoadingSpinner from "../components/LoadingSpinner";

// Close icon component
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-lg flex flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-slate-900 text-lg font-semibold">
          {title}
        </h3>
        
        <p className="text-slate-600 text-sm">
          {message}
        </p>
        
        <div className="flex justify-end items-center gap-3 mt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm font-medium hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Invite Modal Component
function InviteModal({ isOpen, onClose, teamId, onInviteSuccess }) {
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
      
      // Call the success callback to refresh markers list
      if (onInviteSuccess) {
        onInviteSuccess();
      }

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
      className="fixed inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50"
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
          <button onClick={onClose} className="p-1 rounded-full cursor-pointer hover:bg-slate-100">
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
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 shadow-sm text-center text-neutral-900 text-sm font-medium hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
        ) : (
          // --- INVITATION FORM VIEW ---
          <>
            <div className="self-stretch min-h-10 p-2 bg-neutral-100 rounded-lg flex flex-wrap items-center gap-2 border border-slate-200 ">
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
              <button onClick={handleSendInvites} disabled={isSending} className="flex-1 h-10 px-4 py-2 bg-deakinTeal cursor-pointer rounded-md shadow-sm text-center text-white text-sm font-medium hover:bg-[#0E796B] disabled:bg-slate-400">
                {isSending ? "Sending..." : `Send Invite${emails.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Markers() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const [markers, setMarkers] = useState([]);
  const [markerStats, setMarkerStats] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSortDropdownOpen && !event.target.closest('.sort-dropdown-container')) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  const fetchMarkers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Get markers list
      const markersRes = await api.get(`/team/${teamId}/markers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarkers(markersRes.data);

      // Get markers statistics
      try {
        const statsRes = await api.get(`/team/${teamId}/marker-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMarkerStats(statsRes.data.markerStats || []);
      } catch (statsErr) {
        console.error("Error fetching marker stats, using fallback data:", statsErr);
        // If no stats available, create fallback stats with zeros
        const fallbackStats = markersRes.data.map(marker => ({
          user_id: marker.user_id,
          username: marker.username,
          role: marker.role,
          completed_assignments: 0,
          total_assignments: 0,
          completion_percentage: 0,
          pending_assignments: 0,
          average_deviation: 0
        }));
        setMarkerStats(fallbackStats);
      }
    } catch (err) {
      console.error("Error fetching markers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const res = await api.get(`/team/${teamId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Pending invites:", res.data);
      setPendingInvites(res.data);
    } catch (err) {
      console.error("Error fetching pending invites:", err);
    }
  };

  useEffect(() => {
    fetchMarkers();
    fetchPendingInvites();
  }, [navigate, teamId]);

  // Remove marker from team
  const handleRemoveMarker = async () => {
    if (!markerToDelete) return;

    const token = localStorage.getItem("token");
    try {
      await api.delete(`/team/${teamId}/markers/${markerToDelete.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Delete marker from state in local
      setMarkers(markers.filter(marker => marker.user_id !== markerToDelete.user_id));
      setMarkerStats(markerStats.filter(stat => stat.user_id !== markerToDelete.user_id));
      
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setMarkerToDelete(null);
      setDeleteError("");
    } catch (err) {
      console.error("Error removing marker:", err);
      setDeleteError(err.response?.data?.error || "Failed to remove team member");
    }
  };

  // Send email to marker
  const handleSendEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (marker) => {
    setMarkerToDelete(marker);
    setIsDeleteModalOpen(true);
    setDeleteError("");
  };

  // Filter and sort markers based on search query and sort option
  const filteredAndSortedMarkers = markers
    .filter(marker => {
      const searchLower = searchQuery.toLowerCase();
      return (
        marker.username.toLowerCase().includes(searchLower) ||
        marker.role.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.username.localeCompare(b.username);
        case "date":
          return new Date(a.joined_at) - new Date(b.joined_at);
        default:
          return 0;
      }
    });

  // Get stats for a specific marker
  const getMarkerStats = (userId) => {
    const stats = markerStats.find(stat => stat.user_id === userId);
    if (stats) {
      return {
        completed_assignments: stats.completed_assignments,
        total_assignments: stats.total_assignments,
        completion_percentage: stats.completion_percentage,
        pending_assignments: stats.pending_assignments,
        average_deviation: stats.average_deviation
      };
    }
    
    // If no stats found,
    return {
      completed_assignments: 0,
      total_assignments: 0,
      completion_percentage: 0,
      pending_assignments: 0,
      average_deviation: 0
    };
  };

  
  /*const formatDeviation = (deviation) => {
    if (deviation === 0) return "0%";
    return deviation > 0 ? `+${deviation}%` : `${deviation}%`;
  };*/

  if (isLoading) return <LoadingSpinner pageName="Markers" />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar activeTab={2} />
      </aside>

      {/* Main Content */}
      <div className="ml-72 flex-1 flex flex-col bg-white">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
        <MenuItem 
          menuOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        
        <div className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : ""}`}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-6">
            <h1 className="text-offical-black text-3xl font-bold pt-4 pb-4">
              Markers
            </h1>
            <button
              className="px-4 py-4 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-[#0E796B] transition"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <span className="text-white text-lg font-base">
                + Invite Markers
              </span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 px-6 mb-4 justify-between">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-4">
              <div className="relative w-52 sort-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                >
                  <span className={`text-sm font-medium ${sortBy !== "default" ? 'text-slate-900' : 'text-slate-500'}`}>
                    {sortBy === "default" ? "Sort By" : 
                     sortBy === "alphabetical" ? "Alphabetical Order" : 
                     sortBy === "date" ? "Date Added" : "Sort By"}
                  </span>
                  <img 
                    src="/AssignmentIcon/chevron-down.svg" 
                    alt="Dropdown arrow" 
                    className={`w-4 h-4 transition-transform duration-200 ${isSortDropdownOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                    {[
                      { value: "default", label: "Sort By" },
                      { value: "alphabetical", label: "Alphabetical Order" },
                      { value: "date", label: "Date Added" }
                    ].map((option) => {
                      const isSelected = sortBy === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            isSelected 
                              ? 'bg-slate-100 text-slate-900 font-semibold' 
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {isSelected && (
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
            </div>

            {/* Search Bar */}
            <div className="flex max-w-72">
              <div className="min-h-8 px-3 py-2.5 bg-white border border-slate-300 rounded-lg flex items-center gap-1.5">
                <img
                  src="/navBarIcon/navBar_searchIcon.svg"
                  alt="Search Icon"
                  className="h-3 w-3"
                />
                <input
                  className="bg-transparent outline-none placeholder-slate-500 text-sm w-full"
                  placeholder="Search markers"
                  aria-label="Search markers"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Markers Grid */}
          <div className="px-6">
            {filteredAndSortedMarkers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">
                  {searchQuery ? "No markers found matching your search." : "No markers yet."}
                </p>
                {!searchQuery && (
                  <button
                    className="px-6 py-3 bg-[var(--deakinTeal)] text-white rounded-md hover:bg-[#0E796B] transition"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    Invite Your First Marker
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedMarkers.map((marker) => {
                  const stats = getMarkerStats(marker.user_id);
                  return (
                    <MarkerCard
                      key={marker.user_id}
                      id={marker.user_id}
                      name={marker.username}
                      status={marker.role === "admin" ? "Admin" : "Tutor"}
                      gradedCount={stats.completed_assignments}
                      totalCount={stats.total_assignments}
                      percentage={stats.completion_percentage}
                    
                      flagsRaised={stats.pending_assignments}
                      onRemove={() => openDeleteConfirmation(marker)}
                      onSendEmail={() => handleSendEmail(marker.username)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Invites Section */}
          {pendingInvites.length > 0 && (
            <div className="px-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Pending Invitations</h2>
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="divide-y divide-slate-200">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {invite.invitee_email}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Invited by {invite.inviter_email || "Unknown"} • {new Date(invite.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-lime text-offical-black text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Modal */}
      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        teamId={teamId}
        onInviteSuccess={() => {
          fetchMarkers();
          fetchPendingInvites();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMarkerToDelete(null);
          setDeleteError("");
        }}
        onConfirm={handleRemoveMarker}
        title="Remove Team Member"
        message={
          markerToDelete 
            ? `Are you sure you want to remove ${markerToDelete.username} from the team? This action cannot be undone.`
            : ""
        }
        confirmText="Remove"
        cancelText="Cancel"
      />

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
            <button 
              onClick={() => setDeleteError("")}
              className="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}