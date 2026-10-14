import api from './axios.js'

const fetchSchedule = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/schedule`)
  return response.data.schedule
}

const simulateSchedule = async (projectId, changes) => {
  const response = await api.post(`/projects/${projectId}/simulate`, { changes })
  return response.data
}

export { fetchSchedule, simulateSchedule }