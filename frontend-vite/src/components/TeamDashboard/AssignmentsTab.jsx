import { useState } from "react";
import api from "../../utils/axios";

export default function AssignmentsTab({ assignments, setAssignments, team, userRole }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    rubric: [],
  });
  const [statusMessage, setStatusMessage] = useState("");

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rubrics, setRubrics] = useState([]);

  // Handle input change for assignment
  const handleChange = (field, value) => {
    setNewAssignment({ ...newAssignment, [field]: value });
  };

  // Handle adding a new rubric section
  const addRubric = () => {
    setNewAssignment({
      ...newAssignment,
      rubric: [...newAssignment.rubric, { section_name: "", description: "", max_marks: 0 }],
    });
  };

  // Handle changing a rubric field
  const updateRubric = (index, field, value) => {
    const updatedRubrics = [...newAssignment.rubric];
    updatedRubrics[index][field] = field === "max_marks" ? parseInt(value) : value;
    setNewAssignment({ ...newAssignment, rubric: updatedRubrics });
  };

  // Remove a rubric section
  const removeRubric = (index) => {
    const updatedRubrics = [...newAssignment.rubric];
    updatedRubrics.splice(index, 1);
    setNewAssignment({ ...newAssignment, rubric: updatedRubrics });
  };

  // Create assignment
  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim()) {
      setStatusMessage("Title is required");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await api.post(
        `/team/${team.id}/assignments`,
        newAssignment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAssignments([...assignments, res.data.assignment]);
      setNewAssignment({ title: "", description: "", due_date: "", rubric: [] });
      setStatusMessage("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create assignment", err);
      setStatusMessage("Failed to create assignment");
    }
  };

  // Fetch assignment details
  const fetchAssignmentDetails = async (assignmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/team/${team.id}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedAssignment(res.data.assignment);
      setRubrics(res.data.rubrics || []);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch assignment details:", err);
      alert("Failed to fetch assignment details");
    }
  };

  // Delete assignment
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

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      {/* Assignment List */}
      <ul className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map((a) => (
            <li
              key={a.id}
              className="p-4 border rounded shadow hover:bg-gray-50 cursor-pointer"
              onClick={() => fetchAssignmentDetails(a.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{a.title}</p>
                  <p className="text-sm text-gray-600">
                    Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "No due date"}
                  </p>
                  {a.description && <p className="text-sm">{a.description}</p>}
                </div>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-600">No assignments yet.</p>
        )}
      </ul>

      {/* Create Assignment Button */}
      {userRole === "admin" && (
        <div className="mt-4 flex justify-left">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Assignment
          </button>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 backdrop-blur-sm"></div>
          <div className="relative bg-white p-6 rounded shadow-lg w-96 z-10 max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Create Assignment</h2>

            {statusMessage && <p className="mb-2 text-sm text-red-500">{statusMessage}</p>}

            <input
              type="text"
              placeholder="Title"
              value={newAssignment.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="mb-2 border p-2 w-full rounded"
            />
            <textarea
              placeholder="Description"
              value={newAssignment.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="mb-2 border p-2 w-full rounded"
            />
            <input
              type="datetime-local"
              value={newAssignment.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
              className="mb-2 border p-2 w-full rounded"
            />

            {/* Rubric Sections */}
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Rubrics</h3>
              {newAssignment.rubric.map((r, idx) => (
                <div key={idx} className="border p-2 rounded mb-2 space-y-1">
                  <input
                    type="text"
                    placeholder="Section Name"
                    value={r.section_name}
                    onChange={(e) => updateRubric(idx, "section_name", e.target.value)}
                    className="border p-1 w-full rounded"
                  />
                  <textarea
                    placeholder="Description"
                    value={r.description}
                    onChange={(e) => updateRubric(idx, "description", e.target.value)}
                    className="border p-1 w-full rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max Marks"
                    value={r.max_marks}
                    onChange={(e) => updateRubric(idx, "max_marks", e.target.value)}
                    className="border p-1 w-full rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeRubric(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRubric}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Rubric Section
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showModal && selectedAssignment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-3/4 max-w-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">{selectedAssignment.title}</h2>
            <p className="mb-2">
              <strong>Due Date:</strong>{" "}
              {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleString() : "No due date"}
            </p>
            <p className="mb-4">{selectedAssignment.description || "No description"}</p>

            <h3 className="text-xl font-semibold mb-2">Rubrics</h3>
            <ul className="mb-4">
              {rubrics.length > 0 ? (
                rubrics.map((r) => (
                  <li key={r.id} className="border p-2 rounded mb-2">
                    <p><strong>{r.section_name}</strong> - {r.max_marks} marks</p>
                    <p>{r.description}</p>
                  </li>
                ))
              ) : (
                <p>No rubrics added.</p>
              )}
            </ul>

            {userRole === "admin" && (
              <button
                onClick={() => handleDelete(selectedAssignment.id)}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Assignment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
