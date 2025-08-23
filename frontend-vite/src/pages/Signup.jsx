import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("/api/login", { username, password });
      alert(res.data.message);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/home");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(217, 217, 217, 0.2), rgba(115, 115, 115, 0.7)), url(/Deakin_background.jpg)` 
      }}
    >
      <SignupForm/>
    </div>
  );
}

