import { InfoLiga } from './infoLiga';
import { JugadorLiga } from './jugadorLiga';
import { RondaLiga } from './rondaLiga';

export interface GrupoLiga {
    idGrupoLiga?: number;
    idLiga: number;
    nombre: string;
    descripcion?: string;
    
    // Configuración específica del grupo
    max_jugadores?: number;
    rondas?: number;
    
    // Premios y desempates
    premios?: any; // JSON: {"1": "$1,500", "2": "$1,000", "3": "$800"}
    desempates?: any; // JSON: ["buchholz", "sonneborn_berger"]
    
    // Estado
    activo?: number;
    fecha_creacion?: Date | string;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    liga?: InfoLiga;
    jugadores?: JugadorLiga[];
    rondas_grupo?: RondaLiga[];
}