export type TipoValidacionEdad = 'anio_torneo' | 'fecha_exacta';

export interface Categoria {
    idCategoria?: number;
    nombre: string;
    costo: number;
    nota?: string;
    edadMinima?: number | null;
    edadMaxima?: number | null;

    // Tipo de validación de edad
    tipoValidacionEdad?: TipoValidacionEdad;
}