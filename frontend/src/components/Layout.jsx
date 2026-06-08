import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Layout.css";


export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navLinks = isAdmin
    ? [
        { label: "My Projects",    path: "/admin" },
        { label: "Create Project", path: "/create-project" },
        { label: "Profile",        path: "/profile" },
        { label: "Task Manager", path: "/admin/tasks" },
      ]
    : [
        { label: "Dashboard",         path: "/home" },
        { label: "Explore Projects",  path: "/projects" },
        { label: "Profile",           path: "/profile" },
        { label: "Task Manager", path: "/tasks" },
      ];

  return (
    <div className="layout-root">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div>
          <div className="logo-block">
            <h1 className="logo-text">DevSync</h1>
            <p className="user-meta">
              {user.name} | {user.role === "admin" ? "Admin" : "Collaborator"}
            </p>
          </div>

          <nav className="nav-list">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className={`nav-item ${location.pathname === link.path ? "active" : ""}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </div>
            ))}
          </nav>
        </div>

        <button className="logout-btn" onClick={() => setShowLogout(true)}>
          Logout
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>

      {/* ── Logout confirmation modal ── */}
      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="glass-card modal" onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}></p>
            <h3>Logging out?</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogout(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}