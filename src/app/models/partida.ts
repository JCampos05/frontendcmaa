export type TipoFinalizacion =
    | 'jaquemate'
    | 'tiempo'
    | 'rendicion'
    | 'ilegales'
    | 'incomparecencia'
    | 'empate_comun'
    | 'empate_material'
    | 'empate_50_movidas'
    | 'empate_triple_repeticion'
    | 'otro';

export interface Partida {
    idPartida: number;
    idMesa: number;
    idJugadorGanador?: number;
    resultado: string;
    tipo_finalizacion?: TipoFinalizacion;
    descripcion_finalizacion?: string;
    duracion_minutos?: number;
    fecha_finalizacion?: Date | string;

    // Relaciones
    mesa?: any;
    jugador_ganador?: any;
}

export interface CreatePartidaDto {
    idMesa: number;
    idJugadorGanador?: number;
    resultado: string;
    tipo_finalizacion?: TipoFinalizacion;
    descripcion_finalizacion?: string;
    duracion_minutos?: number;
}

export interface UpdatePartidaDto {
    idJugadorGanador?: number;
    resultado?: string;
    tipo_finalizacion?: TipoFinalizacion;
    descripcion_finalizacion?: string;
    duracion_minutos?: number;
}