import { Jugador } from './jugador';
import { MesaLiga } from './mesaLiga';

export interface PartidaLiga {
    idPartidaLiga?: number;
    idMesaLiga: number;
    idJugadorGanador?: number; // NULL si es empate
    resultado: string; // '1-0', '0-1', '0.5-0.5', '0-0'
    
    tipo_finalizacion?: 'jaquemate' | 'tiempo' | 'rendicion' | 'ilegales' | 
                        'incomparecencia' | 'empate_comun' | 'empate_material' | 
                        'empate_50_movidas' | 'empate_triple_repeticion' | 'otro';
    descripcion_finalizacion?: string;
    duracion_minutos?: number;
    fecha_finalizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    mesa?: MesaLiga;
    jugador_ganador?: Jugador;
}