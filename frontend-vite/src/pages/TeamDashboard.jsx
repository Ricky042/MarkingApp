import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/navBar";

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchTeamData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        
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
    <div className="flex min-h-screen">
      {/* Sidebar fixed to the left */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        {/* Navbar sits on top */}
        <Navbar />

        {/* Page Header Section */}
        <div className="flex justify-between items-center mb-0 px-6 py-6">
          {/* Left: Page Title */}
          <div className="w-28 text-offical-black text-2xl font-semibold font-['Inter'] leading-7">
            Dashboard
          </div>

          {/* Right: New Assignment Button */}
          <button 
            className="px-4 py-2 bg-slate-900 rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-slate-800 transition" 
            onClick={() => navigate(`/team/${teamId}/assignments/new`)}
          >
            <span className="text-white text-sm font-medium font-['Inter'] leading-normal">
              + New Assignment
            </span>
          </button>
        </div>

        {/* Page Content */}
        <div className="px-6 flex-1 flex gap-6">

          {/* Left wrapper: Boxes 1-4 + wide box */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-6 min-h-[6rem] max-h-[12rem]">
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
            <div className="w-full h-72 bg-white rounded-lg outline outline-1 outline-slate-300"></div>

            {/* Second Wide box under the first 4 boxes */}
            <div className="w-full h-72 bg-white rounded-lg outline outline-1 outline-slate-300"></div>
          </div>

          {/* Right wrapper: Stacked boxes */}
          <div className="flex flex-col gap-6 w-48"> {/* The wrapper for all the stacked boxes */}
            <div className="w-full h-48 bg-white rounded-lg outline outline-1 outline-slate-300"> {/* The actual border for the first box */}
              {/* Quick Actions Content */}
              <div className="w-full px-6 pt-3.5 pb-6 inline-flex flex-col justify-start items-start h-full"> {/* Padding inside the whole box */}
                {/* Title */}
                <div className="self-stretch text-slate-900 text-base font-semibold font-['Inter'] leading-7 mb-4">
                  Quick Actions
                </div>

                <div className="flex flex-col justify-between flex-1 w-full">
                  {/* Invite Markers */}
                  <Link 
                    to={`/team/${teamId}/invite`} 
                    className="inline-flex justify-start items-center gap-1.5 cursor-pointer hover:opacity-80"
                  >
                    <img
                      src="/Dashboard/icon/layout.svg"
                      alt="Invite Markers"
                      className="w-4 h-4"
                    />
                    <div className="text-offical-black text-xs font-medium font-['Inter'] leading-7">
                      Invite Markers
                    </div>
                  </Link>


                  {/* Email Markers */}
                  <div className="inline-flex justify-start items-center gap-1.5">
                    <img src="/Dashboard/icon/layout.svg" alt="Email Markers" className="w-4 h-4" />
                    <div className="text-offical-black text-xs font-medium font-['Inter'] leading-7">
                      Email Markers
                    </div>
                  </div>

                  {/* Upcoming Deadlines */}
                  <div className="inline-flex justify-start items-center gap-1.5">
                    <img src="/Dashboard/icon/clipboard-signature.svg" alt="Upcoming Deadlines" className="w-4 h-4" />
                    <div className="text-offical-black text-xs font-medium font-['Inter'] leading-7">
                      Upcoming Deadlines
                    </div>
                  </div>

                  {/* Export Reports */}
                  <div className="inline-flex justify-start items-center gap-1.5">
                    <img src="/Dashboard/icon/users.svg" alt="Export Reports" className="w-4 h-4" />
                    <div className="text-offical-black text-xs font-medium font-['Inter'] leading-7">
                      Export Reports
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full h-64 bg-white rounded-lg outline outline-1 outline-slate-300"></div>
            <div className="w-full h-64 bg-white rounded-lg outline outline-1 outline-slate-300"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
