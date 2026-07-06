import { Torneo } from './torneo';
import { Patrocinador } from './patrocinador';

export type NivelPatrocinador = 'principal' | 'oro' | 'plata' | 'bronce' | 'general';

// Tabla puente: un patrocinador puede estar en múltiples torneos
export interface TorneoPatrocinador {
    idTorneoPatrocinador?: number;
    idTorneo: number;
    idPatrocinador: number;
    nivel?: NivelPatrocinador;
    orden?: number;
    fechaAsignacion?: Date | string;

    // Relaciones
    torneo?: Torneo;
    patrocinador?: Patrocinador;
}
