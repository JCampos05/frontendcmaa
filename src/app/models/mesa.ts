export interface Mesa {
  idMesa: number;
  numeroMesa: number;
  idRonda: number;
  idJugadorBlanco: number;
  idJugadorNegro: number;
  ilegalesBlanco: number;
  ilegalesNegro: number;
  estado: 'pendiente' | 'en_curso' | 'finalizada';
  notas?: string;
  fecha_creacion?: Date | string;
  usuarioEditando?: string;
  timestampEdicion?: Date | string;
  
  // Relaciones
  ronda?: any;
  jugador_blanco?: any;
  jugador_negro?: any;
  partida?: any;
}

export interface CreateMesaDto {
  numeroMesa: number;
  idRonda: number;
  idJugadorBlanco: number;
  idJugadorNegro: number;
  estado?: 'pendiente' | 'en_curso' | 'finalizada';
  notas?: string;
}

export interface UpdateMesaDto {
  numeroMesa?: number;
  ilegalesBlanco?: number;
  ilegalesNegro?: number;
  estado?: 'pendiente' | 'en_curso' | 'finalizada';
  notas?: string;
  timestampEdicion?: Date | string;
}