export const CLIENT_HOME = "/dashboard"

export const CLIENT_ROUTES = [
  "/dashboard",
  "/campaigns",
  "/approvals",
  "/notifications",
  "/ai",
] as const

export function isClientRoute(path: string) {
  return CLIENT_ROUTES.includes(path as typeof CLIENT_ROUTES[number])
}

export function homePathForRole(role?: string) {
  return "/dashboard"
}
