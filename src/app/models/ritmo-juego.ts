export interface RitmoJuego {
    idRitmoJuego?: number;
    nombre: string;
    descripcion?: string;
    minutos: number;
    incremento: number;
    activo?: boolean;
    fechaCreacion?: Date | string;
}