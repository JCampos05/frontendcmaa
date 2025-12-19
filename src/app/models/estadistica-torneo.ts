export interface EstadisticaTorneo {
    idEstadistica?: number;
    idJugador: number;
    idTorneo: number;
    idTorneoCategoria: number;
    puntos: number;
    partidas_jugadas: number;
    victorias: number;
    empates: number;
    derrotas: number;
    posicion_actual?: number | null;
    posicion_anterior?: number | null;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en consultas)
    jugador?: {
        idJugador: number;
        nombre: string;
        apellido1: string;
        apellido2?: string;
        rating?: number;
        edad?: number;
    };
    torneo?: any;
    torneo_categoria?: any;
}

export interface CreateEstadisticaDto {
    idJugador: number;
    idTorneo: number;
    idTorneoCategoria: number;
    puntos?: number;
    partidas_jugadas?: number;
    victorias?: number;
    empates?: number;
    derrotas?: number;
}

export interface UpdateEstadisticaDto {
    puntos?: number;
    partidas_jugadas?: number;
    victorias?: number;
    empates?: number;
    derrotas?: number;
    posicion_actual?: number;
}

// Interface extendida para la vista de resultados
export interface EstadisticaConCambio extends EstadisticaTorneo {
    cambioPosicion?: number;
}