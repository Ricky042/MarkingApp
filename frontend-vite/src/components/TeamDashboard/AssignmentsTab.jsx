export default function AssignmentsTab({ assignments, team, onCreateAssignment }) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      <ul className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map((a) => (
            <li key={a.id} className="p-4 border rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{a.title}</p>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(a.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-600">No assignments yet.</p>
        )}
      </ul>

      {team.user_role === "admin" && (
        <div className="mt-4 flex justify-left">
          <button
            onClick={onCreateAssignment}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Assignment
          </button>
        </div>
      )}
    </div>
  );
}
