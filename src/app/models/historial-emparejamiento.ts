export interface HistorialEmparejamiento {
    idHistorial: number;
    idJugador1: number;
    idJugador2: number;
    idTorneo: number;
    idTorneoCategoria: number;
    numeroRonda: number;
    fecha_emparejamiento?: Date | string;

    // Relaciones
    jugador1?: any;
    jugador2?: any;
    torneo?: any;
    torneo_categoria?: any;
}

export interface CreateHistorialDto {
    idJugador1: number;
    idJugador2: number;
    idTorneo: number;
    idTorneoCategoria: number;
    numeroRonda: number;
}

export interface CreateHistorialRondaDto {
    emparejamientos: CreateHistorialDto[];
}