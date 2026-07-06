import { ZonaHoraria } from './zona-horaria';

// Configuración general del sistema (siempre 1 sola fila: id=1)
export interface ConfigGral {
    idConfig?: number;
    idZonaHoraria: number;

    // Redes sociales
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;

    // Datos del comité
    nombreComite?: string;
    descripcion?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;

    // Configuración
    diasAutoDesactivar?: number;
    extras?: Record<string, any>;

    fechaCreado?: Date | string;
    fechaActualizado?: Date | string;

    // Relaciones
    zonaHoraria?: ZonaHoraria;
}
