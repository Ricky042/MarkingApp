// Currently a basic startup system for our 3 pages in react

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/signup">Signup</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
