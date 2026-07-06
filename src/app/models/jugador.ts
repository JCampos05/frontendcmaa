import { Categoria } from './categoria';
import { Inscripcion } from './inscripcion';

export interface Jugador {
    idJugador?: number;
    nombre: string;
    apellido1: string;
    apellido2?: string;
    telefono?: string;
    fechaNacimiento?: Date | string;
    idCategoria?: number;
    notas?: string;
    estado?: 'pendiente_pago' | 'activo' | 'inactivo';
    pagoConfirmado?: boolean;
    rating?: number;
    fechaRegistro?: Date | string;
    actualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    categoria?: Categoria;
    inscripciones?: Inscripcion[];
}