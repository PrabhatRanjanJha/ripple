import api from './axios.js'

const fetchTasks = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/tasks`)
  return response.data.tasks
}

const createTask = async (projectId, task) => {
  const response = await api.post(`/projects/${projectId}/tasks`, task)
  return response.data.task
}

const updateTask = async (id, task) => {
  const response = await api.patch(`/tasks/${id}`, task)
  return response.data.task
}

const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`)
  return response.data
}

export { fetchTasks, createTask, updateTask, deleteTask }