import { api } from "../api/client";

export interface CampaignFromApi {
  id: string;
  name: string;
  client?: string;
  status: string;
  start?: string;
  end?: string;
  team?: string;
  created_by?: string;
  created_at?: string;
}

export async function fetchCampaigns(): Promise<CampaignFromApi[]> {
  return api.get<CampaignFromApi[]>("/campaigns");
}

export async function createCampaign(data: Partial<CampaignFromApi>) {
  return api.post<CampaignFromApi>("/campaigns", data);
}

export async function updateCampaign(id: string, data: Partial<CampaignFromApi>) {
  return api.patch<CampaignFromApi>(`/campaigns/${id}`, data);
}

export async function deleteCampaign(id: string) {
  return api.delete(`/campaigns/${id}`);
}
