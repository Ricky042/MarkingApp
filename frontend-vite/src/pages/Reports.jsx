import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function ReportPage() {
  const { teamId } = useParams();
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const navigate = useNavigate();

  // Fetch admin role first
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

    fetchUserRole();
  }, [teamId, navigate]);

  // Fetch completed assignments (admin only)
  useEffect(() => {
    const fetchCompletedAssignments = async () => {
      if (currentUserRole !== "admin") return;
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      setIsLoading(true);
      try {
        const res = await api.get(`/team/${teamId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter to show only completed ones
        const completed = (res.data.assignments || []).filter(
          (a) => a.status?.toUpperCase() === "COMPLETED"
        );

        setCompletedAssignments(completed);
      } catch (err) {
        console.error("Error fetching completed assignments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedAssignments();
  }, [teamId, navigate, currentUserRole]);

  // Simulated stats for now (to replace with backend data later)
  const reportStats = selectedAssignment
    ? {
        totalSubmissions: 8,
        averageScore: 18,
        withinDeviation: 6,
        outsideDeviation: 2,
        flagsOpen: 3,
      }
    : null;

  if (isLoading)
    return (
      <div className="ml-56 flex justify-center items-center h-screen">
        Loading reports...
      </div>
    );

  if (currentUserRole !== "admin") {
    return (
      <div className="ml-56 flex justify-center items-center h-screen text-lg font-semibold">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar activeTab={2} />
      </aside>

      {/* Main Content */}
      <div className="ml-56 flex-1 flex flex-col bg-white">
        <Navbar onBurgerClick={() => setMenuOpen((v) => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div
          className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${
            menuOpen ? "ml-56" : "mr-0"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-6">
            <div className="text-offical-black text-3xl font-bold">
              Reports
            </div>
          </div>

          {/* --- Assignment Selection View --- */}
          {!selectedAssignment && (
            <div className="px-6 pb-8">
              <h2 className="text-lg font-semibold mb-4 text-zinc-700">
                Completed Assignments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedAssignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className="bg-white p-4 rounded-2xl shadow hover:shadow-md cursor-pointer transition"
                  >
                    <div className="font-semibold text-lg text-slate-800">
                      {a.course_name}
                    </div>
                    <div className="text-sm text-zinc-600">
                      {a.course_code} — Semester {a.semester}
                    </div>
                    <div className="mt-2 text-[var(--deakinTeal)] font-medium">
                      View Report →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Selected Assignment Report View --- */}
          {selectedAssignment && (
            <div className="px-6 pb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedAssignment.course_name}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {selectedAssignment.course_code} — Semester{" "}
                    {selectedAssignment.semester}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-[var(--deakinTeal)] hover:underline"
                >
                  ← Back to list
                </button>
              </div>

              {/* Stats Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {reportStats.totalSubmissions}
                  </p>
                  <p className="text-sm text-zinc-600">Total submissions</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {reportStats.averageScore}%
                  </p>
                  <p className="text-sm text-zinc-600">Average score</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {reportStats.withinDeviation}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Within deviation
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {reportStats.outsideDeviation}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Outside deviation
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {reportStats.flagsOpen}
                  </p>
                  <p className="text-sm text-zinc-600">Flags open</p>
                </div>
              </div>

              {/* Placeholder for charts / future data */}
              <div className="bg-white rounded-2xl shadow p-6 text-center text-zinc-500">
                Detailed report visualization coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
