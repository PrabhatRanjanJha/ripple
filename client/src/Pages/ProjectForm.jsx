import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { createProject, fetchProject, updateProject } from "../axiosCalls/axios";

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  deadline: "",
};

function inputDate(value) {
  return value ? value.slice(0, 10) : "";
}

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const loadProject = async () => {
      setLoading(true);
      setError("");
      try {
        const project = await fetchProject(id);
        if (active) {
          setForm({
            title: project.title || "",
            description: project.description || "",
            startDate: inputDate(project.startDate),
            deadline: inputDate(project.deadline),
          });
        }
      } catch (apiError) {
        if (active) {
          setError(apiError?.response?.data?.message || "Unable to load this project.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProject();
    return () => {
      active = false;
    };
  }, [id]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const projectData = {
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      deadline: form.deadline || null,
    };

    try {
      if (isEditing) {
        await updateProject(id, projectData);
      } else {
        await createProject(projectData);
      }
      navigate("/projects", { replace: true });
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save this project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-600">Loading project...</p>;
  }

  if (isEditing && error && !form.title) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <StatusMessage message={error} />
          <Link to="/projects" className="mt-4 inline-flex font-semibold text-sky-700 hover:text-sky-600">
            Back to projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
          {isEditing ? "Update your plan" : "Plan a project"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{isEditing ? "Edit project" : "Create project"}</h1>
        <p className="mt-2 text-slate-600">Set the project dates and a short description for your plan.</p>

        <div className="mt-6">
          <StatusMessage message={error} />
        </div>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
              Project title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={100}
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
            />
            <p className="mt-1 text-right text-xs text-slate-500">{form.title.length}/100</p>
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="mb-1 block text-sm font-medium text-slate-700">
                Deadline (optional)
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                min={form.startDate || undefined}
                value={form.deadline}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {saving ? "Saving..." : isEditing ? "Save changes" : "Create project"}
            </button>
            <Link
              to="/projects"
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
