import { Jugador } from './jugador';
import { Torneo } from './torneo';
import { Categoria } from './categoria';

export interface Inscripcion {
    idInscripcion?: number;
    idJugador: number;
    idTorneo: number;
    idCategoria?: number;

    // Estado de inscripción
    estado?: 'pendiente_pago' | 'confirmado' | 'cancelado';

    // Datos de pago
    pagoConfirmado?: boolean;
    montoPagado?: number;

    // Edad calculada a la fecha del torneo
    edad?: number;

    // Confirmación de pago por admin
    idAdminConfirmo?: number;

    // Notas
    notas?: string;

    // Fechas
    fechaInscripcion?: Date | string;
    fechaConfirmacion?: Date | string;
    fechaActualizacion?: Date | string;

    // Relaciones (cuando se incluyen en las consultas)
    jugador?: Jugador;
    torneo?: Torneo;
    categoria?: Categoria;
}