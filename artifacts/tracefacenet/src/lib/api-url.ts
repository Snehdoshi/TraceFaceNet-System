const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export function apiUrl(pathname: string) {
  if (!apiBaseUrl) return pathname;
  return `${apiBaseUrl.replace(/\/+$/, "")}${pathname}`;
}