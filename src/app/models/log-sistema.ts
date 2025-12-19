import { Usuario } from './usuario';

export interface LogSistema {
    idLog?: number;
    idUsuario?: number;
    accion: string;
    entidad: string;
    idEntidad?: number;
    detalles?: string;
    nivel: 'info' | 'warning' | 'error' | 'otro';
    ip?: string;
    fecha: Date | string;
    usuario?: Usuario;
}

export interface EstadisticasLogs {
    porNivel: LogPorNivel[];
    porEntidad: LogPorEntidad[];
    porUsuario: LogPorUsuario[];
    porDia: LogPorDia[];
    accionesFrecuentes: AccionFrecuente[];
}

export interface LogPorNivel {
    nivel: string;
    total: number;
}

export interface LogPorEntidad {
    entidad: string;
    total: number;
}

export interface LogPorUsuario {
    idUsuario: number;
    total: number;
    usuario?: {
        telefono: string;
    };
}

export interface LogPorDia {
    dia: string;
    total: number;
}

export interface AccionFrecuente {
    accion: string;
    total: number;
}