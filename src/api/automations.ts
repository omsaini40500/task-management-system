import { api } from "../api/client"

export interface AutomationFromApi {
  id: string

  name: string

  trigger: string

  condition: string

  action: string

  status: string

  runs: number

  lastRun?: string

  createdAt?: string
}

export interface AutomationTemplateFromApi {
  id: string

  name: string

  description: string

  icon: string

  trigger: string

  action: string

  uses: number
}

export interface AutomationHistoryFromApi {
  id: string

  automationId?: string

  automationName: string

  result: string

  time: string

  detail: string
}

export async function fetchAutomations(): Promise<AutomationFromApi[]> {
  return api.get<AutomationFromApi[]>("/automations")
}

export async function createAutomation(data: Partial<AutomationFromApi>) {
  return api.post<AutomationFromApi>("/automations", data)
}

export async function updateAutomation(
  id: string,
  data: Partial<AutomationFromApi>,
) {
  return api.patch<AutomationFromApi>(`/automations/${id}`, data)
}

export async function deleteAutomation(id: string) {
  return api.delete(`/automations/${id}`)
}

export async function fetchAutomationTemplates(): Promise<AutomationTemplateFromApi[]> {
  return api.get<AutomationTemplateFromApi[]>("/automations/templates")
}

export async function fetchAutomationHistory(): Promise<AutomationHistoryFromApi[]> {
  return api.get<AutomationHistoryFromApi[]>("/automations/history")
}
