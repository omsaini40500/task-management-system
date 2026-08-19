export const CLIENT_HOME = "/campaigns"

export const CLIENT_ROUTES = [
  "/campaigns",
  "/approvals",
  "/notifications",
  "/ai",
] as const

export function isClientRoute(path: string) {
  return CLIENT_ROUTES.includes(path as (typeof CLIENT_ROUTES)[number])
}

export function homePathForRole(role?: string) {
  return role === "client" ? CLIENT_HOME : "/dashboard"
}
