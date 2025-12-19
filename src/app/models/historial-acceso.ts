import { Usuario } from './usuario';

export interface HistorialAcceso {
    idAcceso?: number;
    idUsuario: number;
    tipo: 'login_exitoso' | 'login_fallido' | 'logout' | 'otro';
    ip?: string;
    navegador?: string;
    dispositivo?: string;
    ubicacion?: string;
    fecha: Date | string;
    usuario?: Usuario;
}

export interface EstadisticasAcceso {
    porTipo: AccesoPorTipo[];
    porUsuario: AccesoPorUsuario[];
    porDia: AccesoPorDia[];
}

export interface AccesoPorTipo {
    tipo: string;
    total: number;
}

export interface AccesoPorUsuario {
    idUsuario: number;
    total: number;
    usuario?: {
        telefono: string;
    };
}

export interface AccesoPorDia {
    dia: string;
    total: number;
}