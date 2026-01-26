import { InfoLiga } from './infoLiga';
import { GrupoLiga } from './grupoLiga';
import { MesaLiga } from './mesaLiga';

export interface RondaLiga {
    idRondaLiga?: number;
    idLiga: number;
    idGrupoLiga: number;
    numeroRonda: number;
    
    // Fechas y horarios
    fecha_programada?: Date | string;
    hora_inicio?: string;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    
    // Estado
    estado?: 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';
    
    notas?: string;
    fecha_creacion?: Date | string;
    fecha_actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    liga?: InfoLiga;
    grupo?: GrupoLiga;
    mesas?: MesaLiga[];
}