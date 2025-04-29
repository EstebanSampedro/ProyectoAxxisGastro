export interface User {
    id: number;
    nombre: string;
    permiso: string;
    codigoMedico?: string;
    idDoctor2?: number;
    nomDoctor2?: string;
    estadoDoctor2?: string;
    userDoc?: string

    // Agrega más propiedades según necesites
}