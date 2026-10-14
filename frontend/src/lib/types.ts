export interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface StudentInput {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Course {
  id: number;
  courseCode: string;
  name: string;
  description: string | null;
  credits: number;
  createdAt: string;
}

export interface CourseInput {
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
}

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface Session {
  user: UserAccount;
  expiresAt: number;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserAccount;
}
