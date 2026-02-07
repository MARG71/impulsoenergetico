export function withTenant(path: string, adminId?: string | null) {
  if (!adminId) return path;
  const hasQuery = path.includes("?");
  return `${path}${hasQuery ? "&" : "?"}adminId=${encodeURIComponent(adminId)}`;
}

export function apiWithTenant(path: string, adminId?: string | null) {
  if (!adminId) return path;
  const hasQuery = path.includes("?");
  return `${path}${hasQuery ? "&" : "?"}adminId=${encodeURIComponent(adminId)}`;
}
