// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // ✅ correct import

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
        <>
          <h1 className="text-2xl font-bold mb-4">
            Welcome back, {user.username || user.email}!
          </h1>
          <p className="text-gray-600">You are signed in.</p>
        </>
      ) : (
        <h1 className="text-xl text-red-500">No user is currently signed in.</h1>
      )}
    </div>
  );
}
