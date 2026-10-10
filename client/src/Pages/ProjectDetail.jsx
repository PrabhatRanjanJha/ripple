import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import TaskForm from "../components/TaskForm";
import {
  createTask,
  deleteTask,
  fetchProject,
  fetchTasks,
  updateTask,
} from "../axiosCalls/axios";

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function statusLabel(status) {
  return { todo: "To do", doing: "In progress", done: "Done" }[status] || status;
}

function statusClass(status) {
  return {
    todo: "bg-slate-100 text-slate-700",
    doing: "bg-amber-100 text-amber-800",
    done: "bg-emerald-100 text-emerald-800",
  }[status] || "bg-slate-100 text-slate-700";
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [taskError, setTaskError] = useState("");
  const [saving, setSaving] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, taskData] = await Promise.all([fetchProject(id), fetchTasks(id)]);
      setProject(projectData);
      setTasks(taskData);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to load this project.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleSave = async (taskData) => {
    setSaving(true);
    setTaskError("");
    try {
      if (editingTask) {
        const savedTask = await updateTask(editingTask._id, taskData);
        setTasks((current) => current.map((task) => (task._id === savedTask._id ? savedTask : task)));
      } else {
        const savedTask = await createTask(id, taskData);
        setTasks((current) => [...current, savedTask]);
      }
      setEditingTask(null);
      setFormOpen(false);
    } catch (apiError) {
      setTaskError(apiError?.response?.data?.message || "Unable to save this task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteTask(taskToDelete._id);
      setTasks((current) => current.filter((task) => task._id !== taskToDelete._id));
      setTaskToDelete(null);
      if (editingTask?._id === taskToDelete._id) {
        setEditingTask(null);
        setFormOpen(false);
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete this task.");
    } finally {
      setDeleting(false);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setTaskError("");
    setFormOpen(true);
  };

  const cancelForm = () => {
    setEditingTask(null);
    setTaskError("");
    setFormOpen(false);
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-600">Loading project...</p>;
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <StatusMessage message={error || "Project not found."} />
        <button
          type="button"
          onClick={loadProject}
          className="mt-4 font-semibold text-sky-700 hover:text-sky-600"
        >
          Retry
        </button>
        <Link to="/projects" className="ml-4 font-semibold text-slate-700 hover:text-slate-900">
          Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/projects" className="text-sm font-semibold text-sky-700 hover:text-sky-600">
              &larr; All projects
            </Link>
            <h1 className="mt-3 break-words text-3xl font-bold text-slate-900">{project.title}</h1>
            {project.description && (
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{project.description}</p>
            )}
          </div>
          <Link
            to={`/projects/${project._id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit project
          </Link>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Start date</dt>
            <dd className="mt-1 text-slate-900">{displayDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Deadline</dt>
            <dd className="mt-1 text-slate-900">{displayDate(project.deadline)}</dd>
          </div>
        </dl>
      </section>

      <StatusMessage message={error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Plan work</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Tasks</h2>
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setTaskError("");
                setFormOpen(true);
              }}
              className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500"
            >
              Add task
            </button>
          )}
        </div>

        {taskToDelete && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>
              Delete <span className="font-semibold">{taskToDelete.title}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
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

        {formOpen && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {editingTask ? "Edit task" : "Add a task"}
            </h3>
            <TaskForm
              key={editingTask?._id || "new-task"}
              task={editingTask}
              error={taskError}
              saving={saving}
              onSave={handleSave}
              onCancel={cancelForm}
            />
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No tasks yet</h3>
            <p className="mt-2 text-slate-600">Add a task to begin building your project plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-3 py-3 font-semibold">Task</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Duration</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Notes</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b border-slate-100 align-top last:border-0">
                    <th scope="row" className="max-w-56 break-words px-3 py-4 font-semibold text-slate-900">
                      {task.title}
                    </th>
                    <td className="whitespace-nowrap px-3 py-4 text-slate-700">{task.durationDays} days</td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(task.status)}`}>
                        {statusLabel(task.status)}
                      </span>
                    </td>
                    <td className="max-w-64 whitespace-pre-wrap break-words px-3 py-4 text-slate-600">
                      {task.notes || "—"}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="rounded-md border border-rose-200 px-2.5 py-1.5 font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
