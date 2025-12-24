export interface Categoria {
    idCategoria?: number;
    nombre: string;
    costo: number;
    nota?: string;
    edadMinima?: number | null;
    edadMaxima?: number | null;
}