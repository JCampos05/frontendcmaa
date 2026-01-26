import { Jugador } from './jugador';
import { RondaLiga } from './rondaLiga';
import { PartidaLiga } from './partidaLiga';

export interface MesaLiga {
    idMesaLiga?: number;
    numeroMesa: number;
    idRondaLiga: number;
    idJugadorBlanco: number;
    idJugadorNegro: number;
    
    // Control de partida
    ilegalesBlanco?: number;
    ilegalesNegro?: number;
    estado?: 'pendiente' | 'en_curso' | 'finalizada';
    
    // Edición concurrente
    usuarioEditando?: string;
    timestampEdicion?: Date | string;
    
    notas?: string;
    fecha_creacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    ronda?: RondaLiga;
    jugador_blanco?: Jugador;
    jugador_negro?: Jugador;
    partida?: PartidaLiga;
}