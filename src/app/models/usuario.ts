export interface Usuario {
    idUsuario?: number;
    telefono: string;
    password?: string;
    fechaActualizacion?: Date | string;
    fechaRegistro?: Date | string;
}