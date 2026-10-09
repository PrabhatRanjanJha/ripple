import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { deleteProject, fetchProjects } from "../axiosCalls/axios";

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setProjects(await fetchProjects());
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async () => {
    if (!projectToDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteProject(projectToDelete._id);
      setProjects((current) => current.filter((project) => project._id !== projectToDelete._id));
      setProjectToDelete(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete this project.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Your plans</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Projects</h1>
        </div>
        <Link
          to="/projects/new"
          className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500"
        >
          Create project
        </Link>
      </div>

      <StatusMessage message={error} />

      {projectToDelete && (
        <div className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            Delete <span className="font-semibold">{projectToDelete.title}</span>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProjectToDelete(null)}
              disabled={deleting}
              className="rounded-lg border border-amber-300 px-3 py-2 font-medium hover:bg-amber-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-600 px-3 py-2 font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-600">Loading projects...</p>
      ) : error && projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Projects could not be loaded. Please try again.
          <button
            type="button"
            onClick={loadProjects}
            className="ml-2 font-semibold text-sky-700 hover:text-sky-600"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900">No projects yet</h2>
          <p className="mt-2 text-slate-600">Create a project to start planning dates and tasks.</p>
          <Link to="/projects/new" className="mt-5 inline-flex font-semibold text-sky-700 hover:text-sky-600">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="break-words text-xl font-bold text-slate-900">{project.title}</h2>
              {project.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Start date</dt>
                  <dd className="mt-1 text-slate-900">{displayDate(project.startDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Deadline</dt>
                  <dd className="mt-1 text-slate-900">{displayDate(project.deadline)}</dd>
                </div>
              </dl>
              <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  to={`/projects/${project._id}/edit`}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setProjectToDelete(project)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
