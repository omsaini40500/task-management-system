import { api } from "../api/client";

let deptCache: Array<{ id: string; name: string }> | null = null;
let teamCache: Array<{ id: string; name: string; departmentId?: string }> | null = null;
let projCache: Array<{ id: string; name: string }> | null = null;
let clientCache: Array<{ id: string; name: string }> | null = null;
let userCache: Array<{ id: string; name: string; avatar: string }> | null = null;

export async function getDepartments() {
  if (!deptCache) deptCache = await api.get<Array<{ id: string; name: string }>>("/departments");
  return deptCache;
}
export async function getTeams() {
  if (!teamCache) teamCache = await api.get<Array<{ id: string; name: string; departmentId?: string }>>("/teams");
  return teamCache;
}
export async function getProjects() {
  if (!projCache) projCache = await api.get<{items: Array<{ id: string; name: string }>}>("/projects").then(res => res.items);
  return projCache;
}
export async function getClients() {
  if (!clientCache) clientCache = await api.get<Array<{ id: string; name: string }>>("/clients");
  return clientCache;
}
export async function getUsers() {
  if (!userCache) userCache = await api.get<{items: Array<{ id: string; name: string; avatar: string }>}>("/users").then(res => res.items);
  return userCache;
}

export function resolveDeptName(id?: string) {
  return deptCache?.find((d) => d.id === id)?.name || id || "";
}
export function resolveTeamName(id?: string) {
  return teamCache?.find((t) => t.id === id)?.name || id || "";
}
export function resolveProjectName(id?: string) {
  return projCache?.find((p) => p.id === id)?.name || id || "";
}
export function resolveClientName(id?: string) {
  return clientCache?.find((c) => c.id === id)?.name || id || "";
}
export function resolveUserName(id?: string) {
  return userCache?.find((u) => u.id === id)?.name || id || "";
}
export function resolveUserAvatar(id?: string) {
  return userCache?.find((u) => u.id === id)?.avatar || "U";
}
