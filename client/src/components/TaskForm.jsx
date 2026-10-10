import { useEffect, useState } from "react";
import StatusMessage from "./StatusMessage";

const emptyTask = {
  title: "",
  durationDays: "1",
  status: "todo",
  notes: "",
};

function taskValues(task) {
  if (!task) {
    return emptyTask;
  }

  return {
    title: task.title || "",
    durationDays: String(task.durationDays ?? 1),
    status: task.status || "todo",
    notes: task.notes || "",
  };
}

export default function TaskForm({ task, error, saving, onSave, onCancel }) {
  const [form, setForm] = useState(() => taskValues(task));

  useEffect(() => {
    setForm(taskValues(task));
  }, [task]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      title: form.title.trim(),
      durationDays: Number(form.durationDays),
      status: form.status,
      notes: form.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StatusMessage message={error} />

      <div>
        <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-slate-700">
          Task title
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-duration" className="mb-1 block text-sm font-medium text-slate-700">
            Duration (days)
          </label>
          <input
            id="task-duration"
            name="durationDays"
            type="number"
            min="1"
            max="365"
            step="1"
            value={form.durationDays}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />
        </div>

        <div>
          <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="task-status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="todo">To do</option>
            <option value="doing">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="task-notes" className="mb-1 block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="task-notes"
          name="notes"
          rows="3"
          value={form.notes}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : task ? "Save task" : "Add task"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
