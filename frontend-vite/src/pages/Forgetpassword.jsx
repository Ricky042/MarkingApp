// Page that allows you to signup, can access login from here

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ForgetPasswordForm } from "@/components/forgetpassword-form";

export default function changePassword() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleForgetpassword = async () => {
    try {
      await axios.post("http://localhost:5000/signup", { username, password });
      alert("Signup successful, please login");
      navigate("/login");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(217, 217, 217, 0.2), rgba(115, 115, 115, 0.7)), url(/Deakin_background.jpg)` 
      }}
    >
      <ForgetPasswordForm/>
    </div>
  );
}
