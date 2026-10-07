import { Link, useNavigate } from "react-router-dom";
import api from "../axiosCalls/axios";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/home" className="text-lg font-bold text-slate-900">
          Ripple
        </Link>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          {user ? (
            <>
              <Link to="/home" className="hover:text-slate-900">
                Home
              </Link>
              <Link to="/projects" className="hover:text-slate-900">
                Projects
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-slate-900">
                Login
              </Link>
              <Link to="/register" className="hover:text-slate-900">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
