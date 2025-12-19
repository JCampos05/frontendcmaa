export interface Ronda {
    idRonda: number;
    idTorneo: number;
    idTorneoCategoria: number;
    numeroRonda: number;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    estado: 'pendiente' | 'en_curso' | 'finalizada';
    notas?: string;
    fecha_creacion?: Date | string;

    // Relaciones
    torneo?: any;
    torneo_categoria?: any;
    mesas?: any[];
}

export interface CreateRondaDto {
    idTorneo: number;
    idTorneoCategoria: number;
    numeroRonda: number;
    fecha_inicio?: Date | string;
    estado?: 'pendiente' | 'en_curso' | 'finalizada';
    notas?: string;
}

export interface UpdateRondaDto {
    numeroRonda?: number;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    estado?: 'pendiente' | 'en_curso' | 'finalizada';
    notas?: string;
}