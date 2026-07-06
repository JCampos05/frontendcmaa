import { TorneoPatrocinador } from './torneo-patrocinador';

// Catálogo de patrocinadores del comité
export interface Patrocinador {
    idPatrocinador?: number;
    nombre: string;
    logoUrl?: string;
    sitioWeb?: string;
    descripcion?: string;
    contacto?: string;
    activo?: boolean;
    fechaRegistro?: Date | string;
    actualizacion?: Date | string;

    // Relaciones
    torneos?: TorneoPatrocinador[];
}
