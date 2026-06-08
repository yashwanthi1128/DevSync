import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function ExploreProjects() {
  const [projects, setProjects] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchProjects = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user._id || user.id || "";
      const res = await API.get("/projects");
      const list = (res.data.projects || []).map(p => ({
        ...p,
        status: p.status || "Open",
        rejected: p.rejected || [],
        applications: p.applications || [],
        collaborators: p.collaborators || [],
        skillsRequired: p.skillsRequired || [],
        createdBy: p.createdBy || { name: "Unknown", email: "" }
      }));
      setProjects(list);
      if (!userId) return;
      const map = {};
      list.forEach((p) => {
        const inCollaborators = p.collaborators?.some((c) => (typeof c === "object" ? c._id?.toString() : c?.toString()) === userId);
        const inRejected      = p.rejected?.some((r) => (typeof r === "object" ? r._id?.toString() : r?.toString()) === userId);
        const inApplications  = p.applications?.some((a) => (typeof a === "object" ? a._id?.toString() : a?.toString()) === userId);
        if (inCollaborators)     map[p._id] = "accepted";
        else if (inRejected)     map[p._id] = "rejected";
        else if (inApplications) map[p._id] = "applied";
      });
      setStatusMap(map);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const apply = async (id) => {
    setStatusMap((prev) => ({ ...prev, [id]: "applied" }));
    try {
      await API.post(`/projects/${id}/apply`, {});
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg !== "Already applied") {
        setStatusMap((prev) => { const s = { ...prev }; delete s[id]; return s; });
      }
    }
  };

  const getActionButton = (projectId, projectStatus) => {
    const s = statusMap[projectId];
    if (s === "accepted") return <span style={statusBadge("#109569")}>Accepted</span>;
    if (s === "rejected") return <span style={statusBadge("#a31c1c")}>Rejected</span>;
    if (s === "applied")  return <span style={statusBadge("#ac72ed")}>Applied</span>;
    if (projectStatus === "Closed") return <span style={statusBadge("#6b7280")}>Closed</span>;
    return <button onClick={() => apply(projectId)} style={applyBtn}>Apply</button>;
  };

  const filtered = projects.filter((p) => {
    const matchTitle  = p.title.toLowerCase().includes(search.toLowerCase());
    const matchSkill  = skillFilter === "" || p.skillsRequired.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchTitle && matchSkill && matchStatus;
  });

  if (loading) return <Layout><p style={{ color: "#fff", padding: "40px" }}>Loading projects...</p></Layout>;

  return (
    <Layout>
      <h1 style={{ color: "rgb(92, 83, 220)", marginBottom: "4px" }}>Explore Projects</h1>
      <p style={{ color: "#f8fafc", marginTop: 0, marginBottom: "20px" }}>
        Find projects that match your skills and apply
      </p>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={filterInput}
        />
        <input
          placeholder="Filter by skill..."
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          style={filterInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...filterInput, flex: "0 0 130px", colorScheme: "dark" }}
        >
          <option style={{ background: "#1a1a2e" }} value="All">All Status</option>
          <option style={{ background: "#1a1a2e" }} value="Open">Open</option>
          <option style={{ background: "#1a1a2e" }} value="Closed">Closed</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "#4b5563", padding: "40px", textAlign: "center" }}>
          No projects match your search.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" }}>
        {filtered.map((p) => (
          <div key={p._id} style={cardStyle} {...cardHoverProps}>
            <h3 style={{ margin: "0 0 12px", color: "#fff", fontSize: "18px", fontWeight: "700" }}>{p.title}</h3>
            <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.5", minHeight: "63px" }}>
              {p.description}
            </p>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
                Posted by: {p.createdBy?.name || "Unknown"}
              </p>
              {p.collaborators?.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", flexWrap: "wrap" }}>
                  <span style={{ color: "#6b7280" }}>Team:</span>
                  {p.collaborators.slice(0, 3).map((c, idx) => (
                    <span key={idx} style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>
                      {c.name || "Member"}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {getActionButton(p._id, p.status)}
              <button onClick={() => setSelectedProject(p)} style={viewDetailsBtn}>View Details</button>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div style={modalOverlay} onClick={() => setSelectedProject(null)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "24px" }}>{selectedProject.title}</h2>
              <span onClick={() => setSelectedProject(null)} style={{ color: "#6b7280", cursor: "pointer", fontSize: "28px", lineHeight: 1 }}>×</span>
            </div>
            <div style={{ color: "#9ca3af", fontSize: "15px", lineHeight: "1.7", marginBottom: "20px" }}>
              {selectedProject.description}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "#a78bfa", margin: "0 0 8px", fontWeight: "600" }}>Skills Required:</p>
              <p style={{ fontSize: "14px", color: "#d1d5db", margin: 0 }}>{selectedProject.skillsRequired?.join(", ") || "None specified"}</p>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "#a78bfa", margin: "0 0 8px", fontWeight: "600" }}>Posted by:</p>
              <p style={{ fontSize: "14px", color: "#d1d5db", margin: 0 }}>{selectedProject.createdBy?.name} ({selectedProject.createdBy?.email})</p>
            </div>
            {selectedProject.collaborators?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "14px", color: "#a78bfa", margin: "0 0 8px", fontWeight: "600" }}>Team Members:</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedProject.collaborators.map((c, idx) => (
                    <span key={idx} style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "6px 14px", borderRadius: "8px", fontSize: "13px" }}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              {getActionButton(selectedProject._id, selectedProject.status)}
              <button onClick={() => setSelectedProject(null)} style={{ ...viewDetailsBtn, background: "rgba(107,114,128,0.2)" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const filterInput = {
  flex: 1, minWidth: "150px", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
  color: "#fff", fontSize: "14px", outline: "none", fontFamily: "inherit"
};
const cardStyle = {
  background: "#141434", padding: "24px", borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transition: "all 0.25s ease",
};
const cardHoverProps = {
  onMouseEnter: (e) => {
    e.currentTarget.style.borderColor = "#7c3aed";
    e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
    e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.4)";
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
  },
  onMouseLeave: (e) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
    e.currentTarget.style.background = "#141434";
  }
};
const applyBtn = {
  padding: "10px 24px", background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
  color: "#fff", border: "none", borderRadius: "8px",
  cursor: "pointer", fontWeight: "bold", fontSize: "14px", flex: 1
};
const viewDetailsBtn = {
  padding: "10px 24px", background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
  color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", flex: 1
};
const statusBadge = (color) => ({
  padding: "10px 24px", background: `${color}26`, color,
  borderRadius: "8px", fontSize: "14px", fontWeight: "bold",
  display: "inline-block", flex: 1, textAlign: "center"
});
const modalOverlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.8)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
};
const modalContent = {
  background: "#1a1a2e", borderRadius: "16px", padding: "32px",
  maxWidth: "600px", width: "100%", maxHeight: "80vh", overflowY: "auto",
  border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
};