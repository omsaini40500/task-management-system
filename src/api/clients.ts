import { api } from "../api/client";

export interface ClientFromApi {
  id: string;
  name: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  status: string;
  createdAt?: string;
}

export interface ClientCreatePayload {
  name: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  status?: string;
}

export interface ClientUpdatePayload {
  name?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  status?: string;
}

export async function fetchClients() {
  return api.get<ClientFromApi[]>("/clients");
}

export async function createClient(data: ClientCreatePayload) {
  return api.post<ClientFromApi>("/clients", data);
}

export async function updateClient(id: string, data: ClientUpdatePayload) {
  return api.patch<ClientFromApi>(`/clients/${id}`, data);
}

export async function deleteClient(id: string) {
  return api.delete<void>(`/clients/${encodeURIComponent(id)}`);
}
