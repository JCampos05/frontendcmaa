import { RitmoJuego } from './ritmo-juego';
import { GrupoLiga } from './grupoLiga';
import { RondaLiga } from './rondaLiga';

export interface InfoLiga {
    idLiga?: number;
    nombre: string;
    descripcion?: string;
    fecha_inicio: Date | string;
    fecha_fin?: Date | string;
    lugar?: string;
    direccion?: string;
    
    // Configuración general
    tipo_sistema?: 'round_robin' | 'suizo' | 'grupos';
    num_grupos?: number;
    clasifican_por_grupo?: number;
    
    // Formato de juego
    idRitmoJuego?: number;
    
    // Inscripciones
    costo_inscripcion?: number;
    cierre_inscripciones?: Date | string;
    max_jugadores?: number;
    
    // Estado y metadata
    activo?: number;
    notas?: string;
    fecha_creacion?: Date | string;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    ritmo_juego?: RitmoJuego;
    grupos?: GrupoLiga[];
    rondas_liga?: RondaLiga[];
}