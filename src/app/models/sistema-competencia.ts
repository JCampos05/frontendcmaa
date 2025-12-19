export interface SistemaCompetencia {
    idSisCompetencia?: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
    fechaCreacion?: Date | string;
}