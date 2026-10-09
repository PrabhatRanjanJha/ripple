import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

export async function fetchProjects() {
  const response = await api.get("/projects");
  return response.data.projects;
}

export async function fetchProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data.project;
}

export async function createProject(project) {
  const response = await api.post("/projects", project);
  return response.data.project;
}

export async function updateProject(id, project) {
  const response = await api.patch(`/projects/${id}`, project);
  return response.data.project;
}

export async function deleteProject(id) {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
}

export default api;
