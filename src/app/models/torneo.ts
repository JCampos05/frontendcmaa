import { Premio } from './premio';
import { Inscripcion } from './inscripcion';
import { TorneoCategoria } from './torneo-categoria';

export interface Torneo {
    idTorneo?: number;
    nombre?: string;
    lugar: string;
    direccion: string;
    fecha: Date | string;
    hora: string;
    categorias?: string[]; // JSON - array de nombres de categorías
    notas?: string;
    rondas: number;
    
    // Aceptar ambos formatos (snake_case del backend y camelCase del frontend)
    cierreInscripciones?: Date | string;
    cierre_inscripciones?: Date | string;
    
    activo?: boolean;
    fechaCreacion?: Date | string;
    fecha_creacion?: Date | string;
    fechaActualizacion?: Date | string;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    // Aceptar ambos aliases
    premios?: Premio[];
    inscripciones?: Inscripcion[];
    torneoCategoria?: TorneoCategoria[];
    torneo_categorias?: TorneoCategoria[];
}