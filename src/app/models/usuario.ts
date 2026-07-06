import { SesionActiva } from './sesion-activa';
import { HistorialAcceso } from './historial-acceso';
import { LogSistema } from './log-sistema';
import { UsuarioTorneo } from './usuario-torneo';

export type RolUsuario = 'adminGral' | 'adminTorneo';

export interface Usuario {
    idUsuario?: number;
    telefono: string;
    password?: string;

    // Rol y estado
    rol?: RolUsuario;
    activo?: boolean;

    // Fechas
    fechaActualizacion?: Date | string;
    fechaRegistro?: Date | string;
    ultimoAcceso?: Date | string;

    // Relaciones
    sesiones?: SesionActiva[];
    historialAccesos?: HistorialAcceso[];
    logs?: LogSistema[];
    torneosAsignados?: UsuarioTorneo[];
}