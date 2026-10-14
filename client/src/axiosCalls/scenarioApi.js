import api from './axios.js'

const fetchScenarios = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/scenarios`)
  return response.data.scenarios
}

const createScenario = async (projectId, scenario) => {
  const response = await api.post(`/projects/${projectId}/scenarios`, scenario)
  return response.data.scenario
}

const runScenario = async (id) => {
  const response = await api.get(`/scenarios/${id}/run`)
  return response.data
}

const deleteScenario = async (id) => {
  const response = await api.delete(`/scenarios/${id}`)
  return response.data
}

export { fetchScenarios, createScenario, runScenario, deleteScenario }