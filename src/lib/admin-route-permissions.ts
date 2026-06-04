import type { AdminPermissions } from "@/lib/admin-action-auth";

export function getAdminHomePath(permissions: AdminPermissions) {
  if (permissions.permViewUsers) return "/sys-admin/users";
  if (permissions.permViewLinks) return "/sys-admin/links";
  if (
    permissions.permManageSiteSettings ||
    permissions.permManageAuthSettings ||
    permissions.permToggleMaintenance
  ) {
    return "/sys-admin/settings";
  }
  if (permissions.permRunMaintenance) return "/sys-admin/maintenance";

  return "/sys-admin";
}

export function canAccessAdminPath(
  permissions: AdminPermissions,
  pathname: string
) {
  if (pathname === "/sys-admin") return true;
  if (pathname === "/sys-admin/users") return permissions.permViewUsers;
  if (pathname.startsWith("/sys-admin/users/")) {
    return permissions.permEditUsers;
  }
  if (pathname === "/sys-admin/links") return permissions.permViewLinks;
  if (pathname.startsWith("/sys-admin/links/")) return permissions.permViewLinks;
  if (pathname === "/sys-admin/settings") {
    return (
      permissions.permManageSiteSettings ||
      permissions.permManageAuthSettings ||
      permissions.permToggleMaintenance
    );
  }
  if (pathname === "/sys-admin/maintenance") {
    return permissions.permRunMaintenance;
  }

  return true;
}

export function resolveAllowedAdminPath(
  permissions: AdminPermissions,
  requestedPath: string
) {
  const pathname = requestedPath.startsWith("/sys-admin")
    ? requestedPath
    : "/sys-admin";

  return canAccessAdminPath(permissions, pathname)
    ? pathname
    : getAdminHomePath(permissions);
}
