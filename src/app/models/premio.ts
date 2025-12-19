export interface Premio {
    idPremio?: number;
    idTorneo: number;
    nombreCategorias: string;
    detalles: PremioDetalle;
}

export interface PremioDetalle {
    [key: string]: any; // Estructura flexible para diferentes tipos de premios
}