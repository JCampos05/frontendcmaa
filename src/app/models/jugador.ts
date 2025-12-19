import { Categoria } from './categoria';
import { Torneo } from './torneo';

export interface Jugador {
    idJugador?: number;
    nombre: string;
    apellido1: string;
    apellido2?: string;
    telefono?: string;
    fechaNacimiento?: Date | string;
    edad?: number;
    idCategoria?: number;
    idTorneo?: number;
    notas?: string;
    estado?: 'activo' | 'inactivo' | 'retirado';
    fechaRegistro?: Date | string;
    actualizacion?: Date | string;
    rating?: number;

    // Relaciones (cuando se incluyen en las consultas)
    categoria?: Categoria;
    torneo?: Torneo;
}