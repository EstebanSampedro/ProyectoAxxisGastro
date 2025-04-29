import { User } from "./user";

export interface Admin extends User {
    idmedico: number;
    codigoMedico: string;
}
