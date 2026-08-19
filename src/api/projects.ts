import { api } from "../api/client";
import { getUsers, resolveUserName } from "./org";
import type { Project, ProjectStatus } from "../types";

export interface ProjectFromApi {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  managerId?: string;
  clientId?: string;
  category?: string;
  color: string;
  team: string[];
  tasks: number;
  completedTasks: number;
}

export async function fetchProjects(): Promise<Project[]> {
  const [projects, users] = await Promise.all([
    api.get<{items: ProjectFromApi[]}>("/projects").then(res => res.items),
    getUsers(),
  ]);
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    status: p.status,
    progress: p.progress,
    startDate: p.startDate || new Date().toISOString(),
    endDate: p.endDate || new Date().toISOString(),
    budget: p.budget,
    spent: p.spent,
    manager: p.managerId || "",
    team: p.team,
    tasks: p.tasks,
    completedTasks: p.completedTasks,
    client: resolveUserName(p.clientId) || p.clientId || "Internal",
    category: p.category || "",
    color: p.color,
  }));
}

export async function createProject(data: Partial<ProjectFromApi>) {
  return api.post<ProjectFromApi>("/projects", data);
}
export async function updateProject(id: string, data: Partial<ProjectFromApi>) {
  return api.patch<ProjectFromApi>(`/projects/${id}`, data);
}
export async function deleteProject(id: string) {
  return api.delete(`/projects/${id}`);
}
