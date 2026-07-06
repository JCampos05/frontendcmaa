import { Categoria } from './categoria';
import { Torneo } from './torneo';

export interface TorneoCategoria {
    idTorneoCat?: number;
    idTorneo: number;
    idCategoria: number;
    rondas: number;

    ritmoJuego?: string;
    sistemaCompetencia?: string;

    calendario?: CalendarioRonda[];
    premios?: PremiosDetalle | null;
    desempates?: string[];
    activo?: boolean;

    // Cierre de inscripciones propio (NULL = usa el del torneo padre)
    cierreInscripciones?: Date | string | null;

    // Cupo máximo para esta categoría
    cupoMaximo?: number | null;

    // Relaciones (cuando se incluyen en las consultas)
    categoria?: Categoria;
    torneo?: Torneo;
}

export interface CalendarioRonda {
    numero: number;
    fecha: string;
    hora?: string;
}

export interface PremiosDetalle {
    [key: string]: {
        descripcion?: string;
        monto?: number;
    } | string;
}