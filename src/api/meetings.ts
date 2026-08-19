import { api } from "../api/client";

export interface MeetingFromApi {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  participants: string;
  agenda: string;
  status: string;
  meetingLink?: string;
  createdBy?: string;
  createdAt?: string;
}

export async function fetchMeetings(): Promise<MeetingFromApi[]> {
  return api.get<MeetingFromApi[]>("/meetings");
}

export async function createMeeting(data: Partial<MeetingFromApi>) {
  return api.post<MeetingFromApi>("/meetings", data);
}

export async function updateMeeting(id: string, data: Partial<MeetingFromApi>) {
  return api.patch<MeetingFromApi>(`/meetings/${id}`, data);
}

export async function deleteMeeting(id: string) {
  return api.delete(`/meetings/${id}`);
}
