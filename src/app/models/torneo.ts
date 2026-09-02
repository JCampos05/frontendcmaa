import { Inscripcion } from './inscripcion';
import { TorneoCategoria } from './torneo-categoria';
import { SistemaPago } from './sistema-pago';
import { ZonaHoraria } from './zona-horaria';
import { TorneoPatrocinador } from './torneo-patrocinador';
import { UsuarioTorneo } from './usuario-torneo';

export type EstadoTorneo = 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface Torneo {
    idTorneo?: number;
    nombre?: string;
    lugar: string;
    direccion: string;
    fecha: Date | string;
    hora_inicio: string;
    hora_fin: string;
    url_maps?: string;
    notas?: string;
    rondas: number;

    // Estado del torneo
    estado?: EstadoTorneo;

    // Control de visibilidad
    esActual?: boolean;
    activo?: boolean;

    // Cupo máximo de participantes
    cupoMaximo?: number;

    // Cierre de inscripciones
    cierreInscripciones?: Date | string;

    idSistemaPago?: number;
    idZonaHoraria?: number;

    fechaCreacion?: Date | string;
    fechaActualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    inscripciones?: Inscripcion[];
    torneoCategorias?: TorneoCategoria[];
    sistemaPago?: SistemaPago;
    zonaHoraria?: ZonaHoraria;
    patrocinadores?: TorneoPatrocinador[];
    adminsAsignados?: UsuarioTorneo[];
}