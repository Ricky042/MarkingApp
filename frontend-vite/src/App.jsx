import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Forgetpassword from "./pages/Forgetpassword.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default redirect from / to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Your main routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgetpassword" element={<Forgetpassword />} />
      </Routes>
    </Router>
  );
}

export default App;
