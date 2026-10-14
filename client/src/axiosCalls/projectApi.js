import api from './axios.js'

const fetchProjects = async () => {
  const response = await api.get('/projects')
  return response.data.projects
}

const fetchProject = async (id) => {
  const response = await api.get(`/projects/${id}`)
  return response.data.project
}

const createProject = async (project) => {
  const response = await api.post('/projects', project)
  return response.data.project
}

const updateProject = async (id, project) => {
  const response = await api.patch(`/projects/${id}`, project)
  return response.data.project
}

const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`)
  return response.data
}

export { fetchProjects, fetchProject, createProject, updateProject, deleteProject }