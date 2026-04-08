import { Categoria } from './categoria';

export interface TorneoCategoria {
    idTorneoCat?: number;
    idTorneo: number;
    idCategoria: number;
    rondas: number;
    
    // Aceptar ambos formatos (snake_case y camelCase)
    ritmoJuego?: string;
    ritmo_juego?: string;
    
    sistemaCompetencia?: string;
    sistema_competencia?: string;
    
    calendario?: CalendarioRonda[];
    premios?: PremiosDetalle;
    desempates?: string[]; // Array de códigos de sistemas de desempate
    activo?: boolean;

    // Cierre de inscripciones propio (NULL = usa el del torneo padre)
    cierre_inscripciones?: Date | string | null;
    cierreInscripciones?: Date | string | null;

    // Relación (cuando se incluye en consultas)
    categoria?: Categoria;
}

export interface CalendarioRonda {
    numero: number;
    fecha: string;
    hora?: string;
}

export interface PremiosDetalle {
    [key: string]: string; // "1": "$1,500", "2": "$1,000", "3": "$800"
}