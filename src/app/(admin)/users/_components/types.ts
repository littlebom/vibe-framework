import type { UserListItem } from "@/features/identity";
export type { UserListItem };
export interface RolePick { id: string; code: string; nameTh: string; nameEn: string }
export interface UserForm { name: string; email: string; roleIds: string[]; mustChangePassword: boolean }
export const emptyForm = (): UserForm => ({ name: "", email: "", roleIds: [], mustChangePassword: false });
