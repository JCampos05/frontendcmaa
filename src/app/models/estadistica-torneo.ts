export interface EstadisticaTorneo {
    idEstadistica?: number;
    idJugador: number;
    idTorneo: number;
    idTorneoCategoria: number;
    rating_torneo?: number | null;
    puntos: number;
    desempates?: { [key: string]: number } | null;
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
    rating_torneo?: number;
    desempates?: { [key: string]: number };
}

export interface UpdateEstadisticaDto {
    puntos?: number;
    partidas_jugadas?: number;
    victorias?: number;
    empates?: number;
    derrotas?: number;
    posicion_actual?: number;
    rating_torneo?: number;
    desempates?: { [key: string]: number };
}

// Interface extendida para la vista de resultados
export interface EstadisticaConCambio extends EstadisticaTorneo {
    cambioPosicion?: number;
}

// Interface para cargar ranking final desde Excel
export interface RankingFinalJugador {
    idJugador: number;
    posicion: number;
    puntos: number;
    rating?: number;
    desempates?: { [key: string]: number };
}

export interface CargarRankingFinalDto {
    idTorneo: number;
    idTorneoCategoria: number;
    jugadores: RankingFinalJugador[];
}