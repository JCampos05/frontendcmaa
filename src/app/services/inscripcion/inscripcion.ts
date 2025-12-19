import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = `${environment.apiUrl}/inscripciones`;

  constructor(private http: HttpClient) {}

  /**
   * FUNCIÓN AUXILIAR: Transformar datos de snake_case a camelCase
   */
  private transformInscripcion(data: any): any {
    if (!data) return data;


    const transformed = {
      idInscripcion: data.idInscripcion,
      idJugador: data.idJugador,
      idTorneo: data.idTorneo,
      idCategoria: data.idCategoria,
      
      // CRÍTICO: Transformar snake_case → camelCase
      fechaInscripcion: data.fecha_inscripcion,
      pagoConfirmado: Boolean(data.pago_confirmado === true || data.pago_confirmado === 1),
      montoPagado: Number(data.monto_pagado) || 0,
      fechaActualizacion: data.fecha_actualizacion,
      
      notas: data.notas,
      estado: data.estado,
      
      // Relaciones
      jugador: data.jugador ? this.transformJugador(data.jugador) : undefined,
      torneo: data.torneo,
      categoria: data.categoria
    };

    return transformed;
  }

  /**
   * FUNCIÓN AUXILIAR: Transformar datos del jugador
   */
  private transformJugador(data: any): any {
    if (!data) return data;

    return {
      idJugador: data.idJugador,
      nombre: data.nombre,
      apellido1: data.apellido1,
      apellido2: data.apellido2,
      telefono: data.telefono,
      fechaNacimiento: data.fecha_nacimiento,
      edad: data.edad,
      rating: data.rating,
      estado: data.estado,
      idCategoria: data.idCategoria,
      idTorneo: data.idTorneo
    };
  }

  crearInscripcionPublica(inscripcion: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public`, inscripcion).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  validarTelefono(telefono: string, idTorneo: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validar-telefono`, {
      telefono,
      torneo_id: idTorneo
    }).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  getAll(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((item: any) => this.transformInscripcion(item));
      }),
      catchError(this.handleError)
    );
  }

  getStatsByTorneo(idTorneo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}/stats`).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * CRÍTICO: Transformar datos al obtener inscripciones por torneo
   */
  getByTorneo(idTorneo: number): Observable<any[]> {
    //console.log('📡 Obteniendo inscripciones del torneo:', idTorneo);
    
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`).pipe(
      map(response => {
        //console.log('📥 Respuesta cruda del backend:', response);
        
        const data = response.data || response || [];
        //console.log(`📦 Total de inscripciones recibidas: ${data.length}`);
        
        // Transformar cada inscripción
        const transformed = data.map((item: any) => this.transformInscripcion(item));
        
        //console.log('Inscripciones transformadas:', transformed.length);
        //console.log('Muestra de la primera inscripción:', transformed[0]);
        
        return transformed;
      }),
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformInscripcion(data);
      }),
      catchError(this.handleError)
    );
  }

  create(inscripcion: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, inscripcion).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformInscripcion(data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ UPDATE - Transformar respuesta
   */
  update(id: number, datos: any): Observable<any> {
    //console.log(' UPDATE - Datos enviados al backend:', datos);

    return this.http.put<any>(`${this.apiUrl}/${id}`, datos).pipe(
      map(response => {
        //console.log(' UPDATE - Respuesta del backend:', response);
        const data = response.data || response;
        return this.transformInscripcion(data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * CONFIRMAR PAGO - Transformar respuesta
   */
  confirmarPago(id: number, montoPagado: number): Observable<any> {
    //console.log(' CONFIRMAR PAGO - ID:', id, 'Monto:', montoPagado);
    
    return this.http.patch<any>(`${this.apiUrl}/${id}/confirmar-pago`, {
      monto_pagado: montoPagado
    }).pipe(
      map(response => {
        //console.log(' CONFIRMAR PAGO - Respuesta:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 400) {
        if (error.error?.errores) {
          return throwError(() => error);
        }
        errorMessage = error.error?.mensaje || error.error?.message || 'Datos inválidos';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = error.error?.mensaje || 'El registro ya existe';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.mensaje || error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('❌ Error en InscripcionService:', error);
    return throwError(() => ({
      error: {
        message: errorMessage,
        errores: error.error?.errores
      },
      status: error.status
    }));
  }
}