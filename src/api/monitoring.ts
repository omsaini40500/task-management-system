import { api } from "../api/client";

export interface ServiceHealthFromApi {
  id: string;
  name: string;
  status: string;
  latency: string;
  uptime: string;
  lastChecked?: string;
}

export interface ErrorLogFromApi {
  id: string;
  time: string;
  level: string;
  service: string;
  message: string;
  stackTrace?: string;
}

export interface CronJobFromApi {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  duration: string;
  status: string;
}

export async function fetchServices(): Promise<ServiceHealthFromApi[]> {
  return api.get<ServiceHealthFromApi[]>("/monitoring/services");
}

export async function fetchErrorLogs(): Promise<ErrorLogFromApi[]> {
  return api.get<ErrorLogFromApi[]>("/monitoring/errors");
}

export async function fetchCronJobs(): Promise<CronJobFromApi[]> {
  return api.get<CronJobFromApi[]>("/monitoring/cron-jobs");
}
