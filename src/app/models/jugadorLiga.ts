import { Jugador } from './jugador';
import { InfoLiga } from './infoLiga';
import { GrupoLiga } from './grupoLiga';

export interface JugadorLiga {
    idJugadorLiga?: number;
    idLiga: number;
    idGrupoLiga: number;
    idJugador: number;
    
    // Información específica para esta liga
    rating_inicial?: number;
    numero_jugador?: number;
    posicion?: number;
    
    // Estado de inscripción
    fecha_inscripcion?: Date | string;
    pago_confirmado?: number;
    monto_pagado?: number;
    estado?: 'inscrito' | 'confirmado' | 'retirado' | 'cancelado';
    
    // Estadísticas en la liga
    puntos?: number;
    partidas_jugadas?: number;
    victorias?: number;
    empates?: number;
    derrotas?: number;
    desempates?: any; // JSON con valores de desempate calculados
    posicion_grupo?: number;
    
    notas?: string;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    jugador?: Jugador;
    liga?: InfoLiga;
    grupo?: GrupoLiga;
}