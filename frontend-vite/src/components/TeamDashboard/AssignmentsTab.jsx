import { useState } from "react";
import api from "../../utils/axios";

export default function AssignmentsTab({ assignments, setAssignments, team, userRole }) {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    sections: [], // { name, description, max_marks, tiers: [{ name, min_mark, max_mark, description }] }
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [rubrics, setRubrics] = useState([]);

  // -----------------------------
  // Fetch assignment details
  // -----------------------------
  const fetchAssignmentDetails = async (assignmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/team/${team.id}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedAssignment(res.data.assignment);
      setRubrics(res.data.rubrics || []);
      setShowModal(true);
      setCurrentStep(0); // 0 = view assignment
    } catch (err) {
      console.error("Failed to fetch assignment details:", err);
      alert("Failed to fetch assignment details");
    }
  };

  // -----------------------------
  // Delete assignment
  // -----------------------------
  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/team/${team.id}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setShowModal(false);
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      alert("Failed to delete assignment");
    }
  };

  // -----------------------------
  // Form handling
  // -----------------------------
  const handleChange = (field, value) => setNewAssignment({ ...newAssignment, [field]: value });

  const addSection = () => {
    setNewAssignment({
      ...newAssignment,
      sections: [...newAssignment.sections, { name: "", description: "", max_marks: 0, tiers: [] }],
    });
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...newAssignment.sections];
    updatedSections[index][field] = field === "max_marks" ? parseInt(value) || 0 : value;
    setNewAssignment({ ...newAssignment, sections: updatedSections });
  };

  const removeSection = (index) => {
    const updatedSections = [...newAssignment.sections];
    updatedSections.splice(index, 1);
    setNewAssignment({ ...newAssignment, sections: updatedSections });
  };

  const addTier = (sectionIndex) => {
    const updatedSections = [...newAssignment.sections];
    const section = updatedSections[sectionIndex];
    const tierCount = section.tiers.length + 1;
    const autoMax = section.max_marks ? Math.ceil(section.max_marks / 4) : 1;
    section.tiers.push({ name: `Tier ${tierCount}`, min_mark: 0, max_mark: autoMax, description: "" });
    setNewAssignment({ ...newAssignment, sections: updatedSections });
  };

  const updateTier = (sectionIndex, tierIndex, field, value) => {
    const updatedSections = [...newAssignment.sections];
    if (field === "min_mark" || field === "max_mark") {
      updatedSections[sectionIndex].tiers[tierIndex][field] = parseInt(value) || 0;
    } else {
      updatedSections[sectionIndex].tiers[tierIndex][field] = value;
    }
    setNewAssignment({ ...newAssignment, sections: updatedSections });
  };

  const removeTier = (sectionIndex, tierIndex) => {
    const updatedSections = [...newAssignment.sections];
    updatedSections[sectionIndex].tiers.splice(tierIndex, 1);
    setNewAssignment({ ...newAssignment, sections: updatedSections });
  };

  // -----------------------------
  // Submit Assignment
  // -----------------------------
  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim()) {
      setStatusMessage("Title is required");
      return;
    }

    const payload = {
      title: newAssignment.title,
      description: newAssignment.description,
      due_date: newAssignment.due_date || null,
      rubric: newAssignment.sections.map(sec => ({
        section_name: sec.name,
        max_marks: sec.max_marks,
        tiers: sec.tiers.map(t => ({
          tier_name: t.name,
          description: t.description,
          min_mark: t.min_mark,
          max_mark: t.max_mark,
        })),
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/team/${team.id}/assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssignments([...assignments, res.data.assignment]);
      setNewAssignment({ title: "", description: "", due_date: "", sections: [] });
      setStatusMessage("");
      setShowModal(false);
      setCurrentStep(1);
    } catch (err) {
      console.error("Failed to create assignment", err);
      setStatusMessage("Failed to create assignment");
    }
  };

  // -----------------------------
  // Step navigation
  // -----------------------------
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Assignment Info
        return (
          <div className="space-y-2">
            <input type="text" placeholder="Title" value={newAssignment.title} onChange={e => handleChange("title", e.target.value)} className="border p-2 w-full rounded"/>
            <textarea placeholder="Description" value={newAssignment.description} onChange={e => handleChange("description", e.target.value)} className="border p-2 w-full rounded"/>
            <input type="datetime-local" value={newAssignment.due_date} onChange={e => handleChange("due_date", e.target.value)} className="border p-2 w-full rounded"/>
          </div>
        );
      case 2: // Sections
        return (
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {newAssignment.sections.map((sec, idx) => (
              <div key={idx} className="border p-2 rounded mb-2 space-y-1">
                <input type="text" placeholder="Section Name" value={sec.name} onChange={e => updateSection(idx, "name", e.target.value)} className="border p-1 w-full rounded"/>
                <textarea placeholder="Description / Reference" value={sec.description} onChange={e => updateSection(idx, "description", e.target.value)} className="border p-1 w-full rounded"/>
                <input type="number" placeholder="Max Marks" value={sec.max_marks} onChange={e => updateSection(idx, "max_marks", e.target.value)} className="border p-1 w-full rounded"/>
                <button onClick={() => removeSection(idx)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove Section</button>
              </div>
            ))}
            <button onClick={addSection} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Section</button>
          </div>
        );
      case 3: // Tiers
        return (
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {newAssignment.sections.map((sec, secIdx) => (
              <div key={secIdx} className="border p-2 rounded mb-2">
                <h4 className="font-semibold">{sec.name} ({sec.max_marks} marks)</h4>
                {sec.tiers.map((tier, tIdx) => (
                  <div key={tIdx} className="border p-1 rounded mb-1 space-y-1">
                    <input type="text" placeholder="Tier Name" value={tier.name} onChange={e => updateTier(secIdx, tIdx, "name", e.target.value)} className="border p-1 w-full rounded"/>
                    <textarea placeholder="Tier Description" value={tier.description} onChange={e => updateTier(secIdx, tIdx, "description", e.target.value)} className="border p-1 w-full rounded"/>
                    <input type="number" placeholder="Min Marks" value={tier.min_mark} onChange={e => updateTier(secIdx, tIdx, "min_mark", e.target.value)} className="border p-1 rounded w-1/2"/>
                    <input type="number" placeholder="Max Marks" value={tier.max_mark} onChange={e => updateTier(secIdx, tIdx, "max_mark", e.target.value)} className="border p-1 rounded w-1/2"/>
                    <button onClick={() => removeTier(secIdx, tIdx)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove Tier</button>
                  </div>
                ))}
                <button onClick={() => addTier(secIdx)} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Add Tier</button>
              </div>
            ))}
          </div>
        );
      case 4: // Review
        return (
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            <h3 className="font-semibold">Assignment Info</h3>
            <p><strong>Title:</strong> {newAssignment.title}</p>
            <p><strong>Description:</strong> {newAssignment.description}</p>
            <p><strong>Due Date:</strong> {newAssignment.due_date ? new Date(newAssignment.due_date).toLocaleString() : "No due date"}</p>
            <h3 className="font-semibold">Sections & Tiers</h3>
            {newAssignment.sections.map((sec, secIdx) => (
              <div key={secIdx} className="border p-2 rounded mb-2">
                <p><strong>{sec.name}</strong> ({sec.max_marks} marks)</p>
                <p>{sec.description}</p>
                {sec.tiers.map((tier, tIdx) => (
                  <div key={tIdx} className="border p-1 rounded mb-1">
                    <p><strong>{tier.name}</strong> ({tier.min_mark}-{tier.max_mark} marks)</p>
                    <p>{tier.description}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      <ul className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map(a => (
            <li key={a.id} className="p-4 border rounded shadow hover:bg-gray-50 cursor-pointer" onClick={() => fetchAssignmentDetails(a.id)}>
              <div>
                <p className="text-lg font-semibold">{a.title}</p>
                <p className="text-sm text-gray-600">Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "No due date"}</p>
                {a.description && <p className="text-sm">{a.description}</p>}
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-600">No assignments yet.</p>
        )}
      </ul>

      {userRole === "admin" && (
        <div className="mt-4 flex justify-left">
          <button onClick={() => { setShowModal(true); setCurrentStep(1); }} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">Create Assignment</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 overflow-auto">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-2xl relative max-h-[90vh] overflow-auto">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)}>✕</button>

            {currentStep > 0 && (
              <div className="flex mb-4 space-x-2">
                {[1,2,3,4].map(step => (
                  <div key={step} className={`flex-1 text-center py-1 rounded ${currentStep===step ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Step {step}</div>
                ))}
              </div>
            )}

            {currentStep === 0 ? (
              selectedAssignment && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{selectedAssignment.title}</h2>
                  <p className="mb-2"><strong>Due Date:</strong> {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleString() : "No due date"}</p>
                  <p className="mb-4">{selectedAssignment.description || "No description"}</p>
                  <h3 className="text-xl font-semibold mb-2">Rubrics</h3>
                  <ul>
                    {rubrics.length > 0 ? rubrics.map(r => (
                      <li key={r.id} className="border p-2 rounded mb-2">
                        <p><strong>{r.section_name}</strong> - {r.max_marks} marks</p>
                        {r.tiers && (
                          <ul>
                            {r.tiers.map((t, idx) => (
                              <li key={idx}>{t.tier_name}: {t.min_mark}-{t.max_mark} marks - {t.description}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )) : <p>No rubrics added.</p>}
                  </ul>
                  {userRole === "admin" && (
                    <button onClick={() => handleDelete(selectedAssignment.id)} className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete Assignment</button>
                  )}
                </div>
              )
            ) : (
              <div>
                {statusMessage && <p className="mb-2 text-sm text-red-500">{statusMessage}</p>}
                {renderStep()}

                <div className="flex justify-between mt-4">
                  {currentStep > 1 && <button onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Back</button>}
                  {currentStep < 4 && <button onClick={nextStep} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Next</button>}
                  {currentStep === 4 && <button onClick={handleCreateAssignment} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Submit</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
