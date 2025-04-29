import { User } from "./user";

export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: User;
}
