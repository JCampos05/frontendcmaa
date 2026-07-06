export interface SistemaPago {
    idSistemaPago?: number;
    nombreCuenta: string;
    banco: string;
    numeroCuenta: string;
    clabe: string;
    telefono: string;
    activo?: boolean;
    fechaRegistro?: Date | string;
    actualizacion?: Date | string;
}