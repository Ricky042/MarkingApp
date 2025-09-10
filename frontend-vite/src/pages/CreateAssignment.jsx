import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../utils/axios";

export default function CreateAssignment() {
  const { teamId } = useParams();

  const [step, setStep] = useState(1);

  // SEMESTER
  const [selectedSemester, setSelectedSemester] = useState("");

  // MARKERS
  const [markers, setMarkers] = useState([]);
  const [showMarkerList, setShowMarkerList] = useState(false);

  // Team members
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // FETCH TEAM MEMBERS
  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(res.data.members || []);
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [teamId]);

  // MARKERS
  const addMarker = (member) => {
    if (!markers.find((m) => m.id === member.id)) {
      setMarkers([...markers, member]);
    }
  };
  const removeMarker = (id) => {
    setMarkers(markers.filter((m) => m.id !== id));
  };
  const availableMembers = teamMembers.filter(
    (member) => !markers.find((m) => m.id === member.id)
  );

  const [assignmentDetails, setAssignmentDetails] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [rubric, setRubric] = useState([
    {
      id: crypto.randomUUID(),
      criteria: "",
      tiers: [{ id: crypto.randomUUID(), value: "" }],
      points: 0,
      deviation: 0,
    },
  ]);

  const [contextMenu, setContextMenu] = useState(null); // { x, y, type, criterionId, tierIndex }

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleStepChange = (nextStep) => setStep(nextStep);

  const updateAssignment = (field, value) =>
    setAssignmentDetails({ ...assignmentDetails, [field]: value });

  const updateCriterionText = (criterionId, value) =>
    setRubric(
      rubric.map((c) => (c.id === criterionId ? { ...c, criteria: value } : c))
    );

  const updateTierText = (criterionId, tierIndex, value) =>
    setRubric(
      rubric.map((c) =>
        c.id === criterionId
          ? {
              ...c,
              tiers: c.tiers.map((t, i) => (i === tierIndex ? { ...t, value } : t)),
            }
          : c
      )
    );

  const updatePoints = (criterionId, value) =>
    setRubric(
      rubric.map((c) => (c.id === criterionId ? { ...c, points: value } : c))
    );

  const updateDeviation = (criterionId, value) =>
    setRubric(
      rubric.map((c) => (c.id === criterionId ? { ...c, deviation: value } : c))
    );

  const addCriterion = () =>
    setRubric([
      ...rubric,
      {
        id: crypto.randomUUID(),
        criteria: "",
        tiers: [{ id: crypto.randomUUID(), value: "" }],
        points: 0,
        deviation: 0,
      },
    ]);

  const addRatingColumn = (criterionId) =>
    setRubric(
      rubric.map((c) =>
        c.id === criterionId
          ? { ...c, tiers: [...c.tiers, { id: crypto.randomUUID(), value: "" }] }
          : c
      )
    );

  const deleteTier = (criterionId, tierIndex) =>
    setRubric(
      rubric.map((c) =>
        c.id === criterionId
          ? { ...c, tiers: c.tiers.filter((_, i) => i !== tierIndex) }
          : c
      )
    );

  const deleteColumn = (tierIndex) =>
    setRubric(rubric.map((c) => ({ ...c, tiers: c.tiers.filter((_, i) => i !== tierIndex) })));

  const deleteRow = (criterionId) => setRubric(rubric.filter((c) => c.id !== criterionId));

  const handleRightClick = (e, type, criterionId, tierIndex = null) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      type,
      criterionId,
      tierIndex,
    });
  };

  const handleContextMenuAction = (action) => {
    if (!contextMenu) return;
    const { type, criterionId, tierIndex } = contextMenu;

    if (action === "delete-box" && type === "rating") deleteTier(criterionId, tierIndex);
    if (action === "delete-column" && type === "rating") deleteColumn(tierIndex);
    if (action === "delete-row") deleteRow(criterionId);

    setContextMenu(null);
  };

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        <Navbar />
        <div className="px-6 py-6 flex-1 overflow-auto">
          {/* Step 1: Assignment Details */}
          {step === 1 && (
            <>
              {/* === STEP 1: Assignment Info === */}
              <div className="w-72 justify-start mb-6">
                <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">
                  Create New Assignment/<br />
                </span>
                <span className="text-bg-[#0F172A] text-2xl font-medium leading-7">
                  Assignment Info<br />
                </span>
              </div>

              {/* Form Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {/* Course Code */}
                  <div className="flex flex-col">
                    <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
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
                    <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                      Semester
                    </div>
                    <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                      <span className="flex-1 text-zinc-600 text-sm font-normal">
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
                <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
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
                        <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                        <div className="text-bg-[#0F172A] text-base font-medium truncate">
                          {marker.username}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Marker Button */}
                  <div
                    className="w-56 h-28 px-4 pt-2.5 pb-1.5 bg-slate-50 rounded-md outline outline-1 outline-offset-[-0.67px] outline-slate-300 flex justify-center items-center cursor-pointer hover:bg-slate-100 transition"
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
            </>
          )}

          {/* ================= Step 2: Rubric Builder (Static Figma Layout) ================= */}
          {step === 2 && (
            <div className="w-full mb-6">
              <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">
                Create New Assignment/<br />
              </span>
              <span className="text-bg-[#0F172A] text-2xl font-medium leading-7">
                Rubric Setup<br />
              </span>

              <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Assignment Criteria</div>
            
              {/* ================= Rubric Table ================= */}
              <div className="w-full bg-white rounded outline outline-1 outline-offset-[-1px] outline-zinc-400 inline-flex flex-col overflow-hidden">

                {/* ---- Header Row ---- */}
                <div className="self-stretch bg-black/5 inline-flex">
                  {/* Criteria Header */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start">
                    <div className="px-3 py-2.5 text-black text-xs font-semibold font-['Inter'] leading-none">
                      Criteria
                    </div>
                  </div>

                  {/* Ratings Header (spans rating columns) */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start">
                    <div className="px-3 py-2.5 text-black text-xs font-semibold font-['Inter'] leading-none">
                      Ratings
                    </div>
                  </div>

                  {/* Empty placeholders for visual alignment of rating columns */}
                  <div className="flex-1 border-t border-zinc-400" />
                  <div className="flex-1 border-t border-zinc-400" />
                  <div className="flex-1 border-t border-zinc-400" />

                  {/* Points Header */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start">
                    <div className="px-3 py-2.5 text-black text-xs font-semibold font-['Inter'] leading-none">
                      Pts
                    </div>
                  </div>

                  {/* Deviation Header */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start">
                    <div className="px-3 py-2.5 text-black text-xs font-semibold font-['Inter'] leading-none">
                      Deviation Threshold
                    </div>
                  </div>
                </div>

                {/* ---- Data Row ---- */}
                <div className="self-stretch bg-white inline-flex">
                  {/* Criterion Cell */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start">
                    <div className="px-3 py-2.5 text-black text-xs font-normal font-['Inter'] leading-none">
                      Introduction: Applies theoretical framework
                    </div>
                  </div>

                  {/* Rating 1 */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start bg-white/40">
                    <div className="px-3 py-2.5 text-black text-xs font-normal font-['Inter'] leading-none">
                      The introduction demonstrates a comprehensive and insightful application of theoretical frameworks, showing strong alignment with the research.
                    </div>
                  </div>

                  {/* Rating 2 */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start bg-white/40">
                    <div className="px-3 py-2.5 text-black text-xs font-normal font-['Inter'] leading-none">
                      The theoretical framework is clearly applied and integrated, though with minor gaps in depth or precision.
                    </div>
                  </div>

                  {/* Rating 3 */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start bg-white/40">
                    <div className="px-3 py-2.5 text-black text-xs font-normal font-['Inter'] leading-none">
                      Some attempt is made to apply relevant frameworks, but the use is limited, inconsistent, or lacks clarity.
                    </div>
                  </div>

                  {/* Rating 4 */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex justify-start items-start bg-white/40">
                    <div className="px-3 py-2.5 text-black text-xs font-normal font-['Inter'] leading-none">
                      Minimal or no application of theoretical frameworks; relevance to the assignment is unclear.
                    </div>
                  </div>

                  {/* Points Cell */}
                  <div className="flex-1 border-l border-t border-zinc-400 relative bg-white/40">
                    {/* Add Ratings Button (Icon Version) */}
                      <div className="absolute left-0 top-5 -translate-x-1/2 cursor-pointer flex items-center justify-center">
                        <img
                          src="/CreateAssignment/icon/Ellipse 3.svg"
                          alt="button background"
                          className="w-5 h-5"
                        />
                        <img
                          src="/CreateAssignment/icon/plus-1.svg"
                          alt="plus sign"
                          className="w-3.5 h-3.5 absolute left-[3px] top-[3px]"
                        />
                      </div>
                    <div className="w-full max-w-[calc(100%-16px)] px-4 h-10 bg-[#FFFFFF] rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] flex justify-center items-center mx-auto mt-2">
                      <div className="text-[#71717A] text-xs font-normal font-['Geist'] leading-tight">
                        Pts Available
                      </div>

                      
                    </div>
                  </div>


                  {/* Deviation Cell */}
                  <div className="flex-1 border-l border-t border-zinc-400 flex flex-col items-center justify-start bg-white/40 pt-2.5">
                    <div className="w-full max-w-[calc(100%-16px)] px-4 h-10 bg-[#FFFFFF] rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] flex items-center gap-4">
                      <span className="text-[#0F172A] text-base font-normal font-['Geist'] leading-none">±</span>
                      <div className="flex-1 text-[#71717A] text-xs font-normal font-['Geist'] leading-none">
                        Deviation
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              <div className="w-36 h-36 bg-slate-500/20 outline outline-1 outline-offset-[-1px] outline-zinc-400 inline-flex flex-col justify-start items-start mt-5">
                <div className="self-stretch flex-1 px-3 py-2.5 inline-flex justify-center items-center overflow-hidden">
                    <div className="w-10 h-10 relative overflow-hidden">
                        <img
                          src="/CreateAssignment/icon/plus.svg"
                          alt="plus sign"
                          className="w-10 h-10"
                        />
                    </div>
                </div>
              </div>
            </div>
          )}

        {/* Footer Actions */}
          <div className="flex justify-end gap-4 px-6 pt-29">
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50">
              Save as Draft
            </button>
            {step === 2 && (
              <button
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50"
                onClick={() => setStep(1)}
              >
                Back
              </button>
            )}
            {step === 1 && (
              <button
                className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800"
                onClick={() => setStep(2)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
