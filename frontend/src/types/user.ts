export type UserRole = 'admin';

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: UserRole;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}
