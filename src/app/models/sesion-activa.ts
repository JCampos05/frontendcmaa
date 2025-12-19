import { Usuario } from './usuario';

export interface SesionActiva {
    idSesion?: number;
    idUsuario: number;
    token: string;
    ip?: string;
    navegador?: string;
    dispositivo?: string;
    ultimoAcceso: Date | string;
    fechaExpiracion?: Date | string;
    activa: number;
    usuario?: Usuario;
}