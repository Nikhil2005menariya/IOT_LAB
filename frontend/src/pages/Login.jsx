import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const [params] = useSearchParams();
  const role = params.get("role") || "system";

  const roleLabel =
    role === "admin" ? "Admin Login" : "System User Login";

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ MISSING STATE (FIX)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:4000/api/v1/auth/login",
        { username, password, role }
      );

      login(res.data);

      // redirect by role
      navigate(role === "admin" ? "/analytics" : "/items");
    } catch (e) {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {roleLabel}
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full border rounded-md px-4 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-md px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="w-full py-2 rounded-md bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-60"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="text-xs text-center text-neutralSoft-500 mt-4">
            Role selected: <strong>{role}</strong>
          </p>
        </div>
      </div>
    </>
  );
}
