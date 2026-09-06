import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environment/enviroment';

export interface CategoriaPublica {
  idCategoria: number;
  nombre: string;
  costo: number;
  edadMinima?: number | null;
  edadMaxima?: number | null;
  rondas: number;
  cierreInscripciones: string | null;
  cupoMaximo: number | null;
  inscritos: number;
  cupoDisponible: number | null;
  cerrada: boolean;
  llena: boolean;
}

export interface JugadorSimilar {
  idJugador: number;
  nombre: string;
  apellido1: string;
  apellido2?: string | null;
  fecha_nacimiento?: string | null;
  rating: number;
  estado: string;
  inscripciones: Array<{
    idInscripcion: number;
    estado: string;
    pago_confirmado: boolean;
    fecha_inscripcion: string;
    torneo: { idTorneo: number; nombre: string; fecha: string; lugar: string };
    categoria: { idCategoria: number; nombre: string };
  }>;
}

export interface InscribirPublicoPayload {
  idJugador?: number;
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  idTorneo: number;
  idCategoria: number;
  notas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionPublicaService {
  private apiUrl = `${environment.apiUrl}/inscripciones-publicas`;

  constructor(private http: HttpClient) {}

  obtenerCategorias(idTorneo: number): Observable<CategoriaPublica[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}/categorias`).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  buscarJugador(q: string): Observable<JugadorSimilar[]> {
    return this.http.get<any>(`${this.apiUrl}/buscar-jugador`, { params: { q } }).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  crear(datos: InscribirPublicoPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, datos).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
