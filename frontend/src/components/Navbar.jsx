import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-brand-600">
          IoT Lab Inventory
        </h1>

        {/* Not logged in */}
        {!user && (
          <div className="flex gap-4">
            <Link
              to="/login?role=system"
              className="px-4 py-2 rounded-md border hover:bg-neutralSoft-100"
            >
              System Login
            </Link>
            <Link
              to="/login?role=admin"
              className="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600"
            >
              Admin Login
            </Link>
          </div>
        )}

        {/* Logged in */}
        {user && (
          <div className="flex gap-4 items-center">
            {/* SYSTEM USER */}
            {user.role === "system" && (
              <>
                <Link to="/items" className="nav-link">Items</Link>
                <Link to="/borrow" className="nav-link">Borrow</Link>
                <Link to="/return" className="nav-link">Return</Link>
              </>
            )}

            {/* ADMIN */}
            {user.role === "admin" && (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/borrowers" className="nav-link">Borrowers</Link>
                <Link to="/items" className="nav-link">Items</Link>
                <Link to="/analytics" className="nav-link">Analytics</Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md border text-sm hover:bg-neutralSoft-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
