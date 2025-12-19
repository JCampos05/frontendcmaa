import { Jugador } from './jugador';
import { Torneo } from './torneo';
import { Categoria } from './categoria';

export interface Inscripcion {
    idInscripcion?: number;
    idJugador: number;
    idTorneo: number;
    fechaInscripcion?: Date | string;
    pagoConfirmado?: boolean;
    montoPagado?: number;
    idCategoria?: number;
    notas?: string;
    estado?: 'pendiente' | 'confirmado' | 'cancelado';
    fechaActualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    jugador?: Jugador;
    torneo?: Torneo;
    categoria?: Categoria;
}