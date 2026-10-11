function DependencyPicker({ tasks, selected, onChange }) {
  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
      return
    }
    onChange([...selected, id])
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No other tasks yet. Add more tasks to create dependencies.</p>
  }

  return (
    <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
      {tasks.map((task) => (
        <label key={task._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={selected.includes(task._id)}
            onChange={() => handleToggle(task._id)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="break-words">{task.title}</span>
        </label>
      ))}
    </div>
  )
}

export default DependencyPicker