import { api } from "../api/client";

export interface LeaveFromApi {
  id: string;
  userId: string;
  userName?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}

export async function fetchLeaves(): Promise<LeaveFromApi[]> {
  return api.get<LeaveFromApi[]>("/leave/requests");
}

export async function createLeave(data: Partial<LeaveFromApi>) {
  return api.post<LeaveFromApi>("/leave/requests", data);
}

export async function updateLeave(id: string, data: Partial<LeaveFromApi>) {
  return api.patch<LeaveFromApi>(`/leave/requests/${id}`, data);
}

export async function deleteLeave(id: string) {
  return api.delete(`/leave/requests/${id}`);
}
