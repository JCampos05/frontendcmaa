// Mapeo de zonas horarias del sistema

export interface ZonaHoraria {
    idZonaHoraria?: number;
    nombreZona: string;
    offsetUTC: number;
    nombreMostrar: string;
    fechaCreado?: Date | string;
    fechaActualizado?: Date | string;
}
