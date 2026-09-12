export type RoleName =
    | "ADMIN"
    | "MANAGER"
    | "STAFF";

export type PermissionName =
    | "users.read"
    | "users.update"
    | "users.delete"
    | "users.invite"
    | "products.read"
    | "products.create"
    | "products.update"
    | "products.delete"
    | "orders.read"
    | "orders.create"
    | "orders.update"
    | "orders.delete";