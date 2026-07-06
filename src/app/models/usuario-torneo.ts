import { Usuario } from './usuario';
import { Torneo } from './torneo';

// Tabla puente: asignar adminTorneo a torneos específicos
export interface UsuarioTorneo {
    idUsuarioTorneo?: number;
    idUsuario: number;
    idTorneo: number;
    activo?: boolean;
    notas?: string;
    fechaAsignacion?: Date | string;
    fecha_asignacion?: Date | string;

    // Relaciones
    usuario?: Usuario;
    torneo?: Torneo;
}
