import { useState, useMemo, useRef, useCallback } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Profile.css";

const Field = ({ label, children }) => (
  <div className="profile-field">
    <label className="profile-label">{label}</label>
    {children}
  </div>
);

const SKILLS_LIST = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "Figma",
  "AWS", "Docker", "MongoDB", "PostgreSQL", "Flutter", "Next.js",
  "Vue", "Angular", "Go", "Rust", "Kubernetes", "GraphQL", "Tailwind",
  "Redux", "Express", "Django", "FastAPI", "Firebase", "Git", "CI/CD",
  "HTML", "CSS", "Sass", "jQuery", "Bootstrap", "Material-UI", "Chakra UI",
  "MySQL", "Redis", "Elasticsearch", "RabbitMQ", "Kafka", "Jenkins",
  "Terraform", "Ansible", "Linux", "Bash", "C++", "C#", "Java", "Kotlin"
];

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState(stored.name || "");
  const [bio, setBio] = useState(stored.bio || "");
  const [github, setGithub] = useState(stored.github || "");
  const [skills, setSkills] = useState(stored.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skillInputRef = useRef(null);

  const suggestions = useMemo(() => {
    if (skillInput.length < 2) return [];
    const lower = skillInput.toLowerCase();
    return SKILLS_LIST.filter(
      s => s.toLowerCase().includes(lower) && !skills.includes(s)
    ).slice(0, 5);
  }, [skillInput, skills]);

  const addSkill = useCallback((skill = null) => {
    const t = skill || skillInput.trim();
    if (t && !skills.includes(t)) {
      setSkills(prev => [...prev, t]);
      setSkillInput("");
      setShowSuggestions(false);
      skillInputRef.current?.focus();
    }
  }, [skillInput, skills]);

  const removeSkill = useCallback((s) => {
    setSkills(prev => prev.filter(sk => sk !== s));
  }, []);

  const handleSave = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await API.put("/users/profile", { name, bio, github, skills });
      const updatedUser = { ...stored, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccess("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(stored.name || "");
    setBio(stored.bio || "");
    setGithub(stored.github || "");
    setSkills(stored.skills || []);
    setSkillInput("");
    setEditing(false);
    setError("");
    setShowSuggestions(false);
  };


  const roleLabel = stored.role === "admin" ? " Project Admin" : "Collaborator";
  const roleBadgeClass = stored.role === "admin" ? "admin" : "collaborator";

  return (
    <Layout>
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your personal information</p>
      </div>

      <div className="profile-card glass-card">
        <Field label="Name">
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="profile-input" placeholder="Your name" />
          ) : (
            <p className="profile-value">{stored.name || "—"}</p>
          )}
        </Field>

        <Field label="Email">
          <p className="profile-value muted">{stored.email || "—"}</p>
        </Field>

        {/* FIX: show admin/collaborator correctly */}
        <Field label="Role">
          <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
        </Field>

        <Field label="Bio">
          {editing ? (
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              rows={3} placeholder="Tell us about yourself"
              className="profile-input profile-textarea" />
          ) : (
            <p className="profile-value">{stored.bio || "No bio yet"}</p>
          )}
        </Field>

        <Field label="GitHub">
          {editing ? (
            <input value={github} onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
              className="profile-input" type="url" />
          ) : (
            <p className="profile-value">
              {stored.github ? (
                <a href={stored.github} target="_blank" rel="noopener noreferrer" className="profile-link">
                  {stored.github}
                </a>
              ) : "Not linked"}
            </p>
          )}
        </Field>

        <Field label="Skills">
          {editing ? (
            <>
              <div className="skill-input-wrap">
                <input ref={skillInputRef} value={skillInput}
                  onChange={(e) => { setSkillInput(e.target.value); setShowSuggestions(e.target.value.length >= 2); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } if (e.key === "Escape") setShowSuggestions(false); }}
                  onFocus={() => skillInput.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Type 2+ letters for suggestions"
                  className="profile-input skill-input" autoComplete="off" />
                <button type="button" onClick={() => addSkill()} className="skill-add-btn">+ Add</button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="skill-suggestions">
                  {suggestions.map(s => (
                    <div key={s} onMouseDown={(e) => { e.preventDefault(); addSkill(s); }} className="skill-suggestion">{s}</div>
                  ))}
                </div>
              )}
              <div className="skill-tags">
                {skills.map((s) => (
                  <span key={s} className="skill-tag">
                    {s} <span onClick={() => removeSkill(s)} className="skill-remove">×</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="skill-tags">
              {stored.skills?.length > 0
                ? stored.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)
                : <p className="profile-value">No skills added yet</p>}
            </div>
          )}
        </Field>

        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}

        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-secondary profile-edit-btn">
            Edit Profile
          </button>
        ) : (
          <div className="profile-actions">
            <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}