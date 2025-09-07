import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../utils/axios";

export default function CreateAssignment() {
  const { teamId } = useParams();
  const [markers, setMarkers] = useState([]);
  const [showMarkerList, setShowMarkerList] = useState(false);

  // STATE FOR SEMESTER SELECT
  const [selectedSemester, setSelectedSemester] = useState("");

  // Team members from DB
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Just use all team members
        setTeamMembers(res.data.members || []);
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  const addMarker = (member) => {
    if (!markers.find((m) => m.id === member.id)) {
      setMarkers([...markers, member]);
    }
  };

  const removeMarker = (id) => {
    setMarkers(markers.filter((m) => m.id !== id));
  };

  // Filter out markers already added to avoid duplicates in the list
  const availableMembers = teamMembers.filter(
    (member) => !markers.find((m) => m.id === member.id)
  );

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Sidebar />

      <div className="ml-56 flex flex-col min-h-screen">
        <Navbar />

        <div className="px-6 py-6 flex-1 overflow-auto">
          {/* Page Header */}
          <div className="w-72 justify-start mb-6">
            <span className="text-offical-black text-2xl font-semibold font-['Inter'] leading-7">
              Create New Assignment/<br />
            </span>
            <span className="text-offical-black text-2xl font-medium font-['Inter'] leading-7">
              Assignment Info<br />
            </span>
          </div>

          {/* Form Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              {/* Course Code */}
              <div className="flex flex-col">
                <div className="justify-start text-offical-black text-base font-semibold font-['Inter'] leading-7 mb-2">
                  Course Code
                </div>
                <input
                  type="text"
                  className="w-72 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter course code"
                />
              </div>

              {/* Semester */}
              <div className="flex flex-col">
                <div className="text-offical-black text-base font-semibold font-['Inter'] leading-7 mb-2">
                  Semester
                </div>
                <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                  <span className="flex-1 text-zinc-600 text-sm font-normal font-['Inter'] leading-normal">
                    {selectedSemester || "Select semester"}
                  </span>
                  <img
                    src="/CreateAssignment/icon/chevron-down.svg"
                    alt="Dropdown arrow"
                    className="w-4 h-4"
                  />
                  <select
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="" disabled>
                      Select semester
                    </option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Markers Section */}
          <div className="flex flex-col gap-2 mt-6">
            <div className="text-offical-black text-base font-semibold font-['Inter'] leading-7 mb-2">
              Markers
            </div>

            {/* Marker Cards */}
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-300 min-h-[360px] w-245">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md outline outline-[0.67px] outline-offset-[-0.67px] outline-slate-300 flex flex-col justify-start gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-zinc-600 text-[8px] font-semibold">
                      {marker.id}
                    </div>
                    <div
                      className="text-zinc-600 text-[8px] font-normal underline cursor-pointer"
                      onClick={() => removeMarker(marker.id)}
                    >
                      Remove
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {/* Black circle avatar */}
                    <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />

                    {/* Truncated username */}
                    <div className="text-offical-black text-base font-medium truncate">
                      {marker.username}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Marker Button */}
              <div
                className="w-56 h-28 px-4 pt-2.5 pb-1.5 bg-slate-50 rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 flex justify-center items-center cursor-pointer hover:bg-slate-100 transition"
                onClick={() => setShowMarkerList(!showMarkerList)}
              >
                <div className="text-3xl font-bold text-zinc-600">+</div>
              </div>
            </div>

            {/* Marker List */}
            {showMarkerList && (
              <div className="mt-3 flex flex-col gap-2 p-3 bg-white rounded-md outline outline-1 outline-slate-300 w-full">
                {loadingMembers ? (
                  <div>Loading team members...</div>
                ) : availableMembers.length === 0 ? (
                  <div className="text-sm text-zinc-600">
                    No team members available.
                  </div>
                ) : (
                  availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                        <div className="text-sm font-medium truncate">
                          {member.username}
                        </div>
                      </div>
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded-md"
                        onClick={() => addMarker(member)}
                      >
                        +
                      </button>
                    </div>
                  ))
                )}
                <div className="text-right mt-2">
                  <button
                    className="text-zinc-600 underline text-sm"
                    onClick={() => setShowMarkerList(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 px-6 pt-29">
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50">
              Save as Draft
            </button>
            <button className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
