import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", skillsRequired: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await API.get("/projects");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const myProjects = res.data.projects.filter(p => p.createdBy?._id === user._id);
      setProjects(myProjects);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const accept = async (pid, uid) => {
    try {
      await API.post(`/projects/${pid}/accept/${uid}`);
      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept applicant");
    }
  };

  const reject = async (pid, uid) => {
    try {
      await API.post(`/projects/${pid}/reject/${uid}`);
      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject applicant");
    }
  };

  const assignTask = (projectId, collaborator) => {
    navigate("/admin/tasks", { state: { projectId, collaborator } });
  };

  // NEW: confirm delete via modal
  const confirmDelete = async () => {
    try {
      await API.delete(`/projects/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete project");
    }
  };

  const openEdit = (p) => {
    setEditProject(p);
    setEditForm({ title: p.title, description: p.description, skillsRequired: p.skillsRequired.join(", ") });
  };

  const saveEdit = async () => {
    try {
      await API.put(`/projects/${editProject._id}`, {
        title: editForm.title,
        description: editForm.description,
        skillsRequired: editForm.skillsRequired.split(",").map(s => s.trim()).filter(Boolean),
      });
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update project");
    }
  };

  const totalApplicants    = projects.reduce((sum, p) => sum + p.applications.length, 0);
  const totalCollaborators = projects.reduce((sum, p) => sum + p.collaborators.length, 0);
  const totalRejected      = projects.reduce((sum, p) => sum + (p.rejected?.length || 0), 0);

  if (loading) return <Layout><p className="loading-text">Loading...</p></Layout>;

  const cards = [
    { key: "created",    label: "Projects Created",       value: projects.length },
    { key: "applicants", label: "Total Applicants",       value: totalApplicants },
    { key: "accepted",   label: "Collaborators Accepted", value: totalCollaborators },
    { key: "rejected",   label: "Applications Rejected",  value: totalRejected },
  ];

  const filterTitles = {
    created:    "All Your Projects",
    applicants: "Projects With Pending Applicants",
    accepted:   "Projects With Collaborators",
    rejected:   "Projects With Rejected Applicants",
  };

  const getPanelContent = () => {
    if (activeFilter === "created")    return projects;
    if (activeFilter === "applicants") return projects.filter(p => p.applications.length > 0);
    if (activeFilter === "accepted")   return projects.filter(p => p.collaborators.length > 0);
    if (activeFilter === "rejected")   return projects.filter(p => (p.rejected?.length || 0) > 0);
    return [];
  };

  const panelProjects = getPanelContent();

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>My Projects</h1>
        <button onClick={() => navigate("/create-project")} className="btn btn-primary">
          + New Project
        </button>
      </div>

      <div className="stats-grid">
        {cards.map((s) => (
          <div key={s.key}
            onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
            className={`stat-card stat-${s.key} ${activeFilter === s.key ? "active" : ""}`}
          >
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
            <p className="stat-hint">{activeFilter === s.key ? "Click to close ↑" : "Click to view →"}</p>
          </div>
        ))}
      </div>

      {activeFilter && (
        <div className={`filter-panel filter-${activeFilter}`}>
          <div className="filter-panel-header">
            <h3>{filterTitles[activeFilter]} ({panelProjects.length})</h3>
            <button onClick={() => setActiveFilter(null)} className="close-btn">×</button>
          </div>
          {panelProjects.length === 0 ? (
            <p className="empty-text">Nothing here yet.</p>
          ) : panelProjects.map((p) => (
            <div key={p._id} className="filter-project-row">
              <div className="project-row-header">
                <div>
                  <p className="project-title">{p.title}</p>
                  <p className="project-skills"><span className="skills-label">Skills: </span>{p.skillsRequired.join(", ")}</p>
                </div>
                <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
              </div>
              {activeFilter === "applicants" && p.applications.map((a) => (
                <div key={a._id || a} className="user-row">
                  <div>
                    <p className="user-name">{a.name || "User"}</p>
                    <p className="user-email">{a.email || a}</p>
                  </div>
                  <div className="user-actions">
                    <button onClick={() => accept(p._id, a._id || a)} className="action-btn accept">Accept</button>
                    <button onClick={() => reject(p._id, a._id || a)} className="action-btn reject">Reject</button>
                  </div>
                </div>
              ))}
              {activeFilter === "accepted" && p.collaborators.map((c) => (
                <div key={c._id || c} className="user-row">
                  <div className="user-tag accepted">{c.name || c}</div>
                  <button onClick={() => assignTask(p._id, c)} className="action-btn accept"
                    style={{ marginLeft: "12px", padding: "6px 12px", fontSize: "13px" }}>
                    Assign Task
                  </button>
                </div>
              ))}
              {activeFilter === "rejected" && p.rejected?.map((r) => (
                <div key={r._id || r} className="user-tag rejected">{r.name || r}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state glass-card">
          <p>No projects yet.</p>
          <button onClick={() => navigate("/create-project")} className="btn btn-primary">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((p) => (
            <div key={p._id} className="project-card glass-card">
              <div className="project-card-header">
                <h3>{p.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                  <button onClick={() => openEdit(p)}
                    style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: "rgba(124,58,237,0.2)", color: "#a78bfa", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(p)}
                    style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: "rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="project-desc">{p.description}</p>
              <p className="project-skills"><b>Skills:</b> {p.skillsRequired.join(", ")}</p>

              <div className="project-section">
                <h4>Applicants ({p.applications.length})</h4>
                {p.applications.length === 0 ? (
                  <p className="empty-text-sm">No applicants yet</p>
                ) : p.applications.map((applicant) => (
                  <div key={applicant._id || applicant} className="user-row">
                    <div>
                      <p className="user-name">{applicant.name || "User"}</p>
                      <p className="user-email">{applicant.email || applicant}</p>
                    </div>
                    <div className="user-actions">
                      <button onClick={() => accept(p._id, applicant._id || applicant)} className="action-btn accept">✓ Accept</button>
                      <button onClick={() => reject(p._id, applicant._id || applicant)} className="action-btn reject">✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="project-section">
                <h4>Collaborators ({p.collaborators.length})</h4>
                {p.collaborators.length === 0 ? (
                  <p className="empty-text-sm">None yet</p>
                ) : p.collaborators.map((c) => (
                  <div key={c._id || c} className="user-row" style={{ justifyContent: "space-between" }}>
                    <div className="user-tag accepted">{c.name || c}</div>
                    <button onClick={() => assignTask(p._id, c)} className="action-btn accept"
                      style={{ padding: "6px 12px", fontSize: "13px" }}>
                      Assign Task
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 999
        }} onClick={() => setDeleteTarget(null)}>
          <div style={{
            background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", padding: "32px", width: "320px", textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🗑️</p>
            <h3 style={{ color: "#fff", margin: "0 0 8px" }}>Delete Project?</h3>
            <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 8px" }}>
              <b style={{ color: "#ef4444" }}>{deleteTarget.title}</b>
            </p>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 24px" }}>
              This will permanently delete the project and all its data.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteTarget(null)} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                background: "rgba(255,255,255,0.08)", color: "#d1d5db",
                border: "none", cursor: "pointer", fontWeight: "600"
              }}>Cancel</button>
              <button onClick={confirmDelete} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                background: "linear-gradient(90deg, #ef4444, #dc2626)",
                color: "#fff", border: "none", cursor: "pointer", fontWeight: "600"
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editProject && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 999, padding: "20px"
        }} onClick={() => setEditProject(null)}>
          <div style={{
            background: "#1a1a2e", borderRadius: "16px", padding: "28px",
            width: "100%", maxWidth: "500px",
            border: "1px solid rgba(255,255,255,0.1)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#fff" }}>Edit Project</h3>
              <span onClick={() => setEditProject(null)} style={{ color: "#6b7280", cursor: "pointer", fontSize: "24px" }}>×</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}>Title</label>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>Skills (comma separated)</label>
                <input value={editForm.skillsRequired} onChange={e => setEditForm({ ...editForm, skillsRequired: e.target.value })} placeholder="React, Node.js, MongoDB" style={inp} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button onClick={() => setEditProject(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#9ca3af", border: "none", cursor: "pointer", fontWeight: "600" }}>
                  Cancel
                </button>
                <button onClick={saveEdit} style={{ flex: 2, padding: "10px", borderRadius: "8px", background: "linear-gradient(90deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const lbl = { display: "block", fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" };
const inp = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };