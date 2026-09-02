import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { JugadorLiga } from '../models/jugadorLiga';

@Injectable({
  providedIn: 'root'
})
export class JugadorLigaService {
  private apiUrl = `${environment.apiUrl}/liga/jugadores`;

  constructor(private http: HttpClient) { }

  /**
   * Función auxiliar para normalizar fechas
   */
  private normalizarFecha(fecha: string | Date | null | undefined): Date | null {
    if (!fecha) return null;
    
    if (typeof fecha === 'string') {
      const fechaSolo = fecha.split('T')[0];
      const [year, month, day] = fechaSolo.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(fecha);
  }

  /**
   * Función auxiliar para transformar jugador liga
   */
  private transformarJugadorLiga(jugadorLiga: any): any {
    if (!jugadorLiga) return null;
    
    return {
      ...jugadorLiga,
      fecha_inscripcion: this.normalizarFecha(jugadorLiga.fecha_inscripcion),
      fecha_actualizacion: this.normalizarFecha(jugadorLiga.fecha_actualizacion)
    };
  }

  /**
   * GET /api/liga/jugadores - Obtener todos los jugadores de liga (protegido)
   */
  getAll(params?: any): Observable<JugadorLiga[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((jugador: any) => this.transformarJugadorLiga(jugador));
      })
    );
  }

  /**
   * GET /api/liga/jugadores/liga/:idLiga - Obtener jugadores por liga (protegido)
   */
  getByLiga(idLiga: number): Observable<JugadorLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((jugador: any) => this.transformarJugadorLiga(jugador));
      })
    );
  }

  /**
   * GET /api/liga/jugadores/grupo/:idGrupo - Obtener jugadores por grupo (protegido)
   */
  getByGrupo(idGrupo: number): Observable<JugadorLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/grupo/${idGrupo}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((jugador: any) => this.transformarJugadorLiga(jugador));
      })
    );
  }

  /**
   * GET /api/liga/jugadores/:id - Obtener jugador por ID (protegido)
   */
  getById(id: number): Observable<JugadorLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarJugadorLiga(data);
      })
    );
  }

  /**
   * POST /api/liga/jugadores - Inscribir jugador (protegido)
   */
  create(jugadorLiga: Partial<JugadorLiga>): Observable<JugadorLiga> {
    return this.http.post<any>(this.apiUrl, jugadorLiga).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarJugadorLiga(data);
      })
    );
  }

  /**
   * PUT /api/liga/jugadores/:id - Actualizar inscripción (protegido)
   */
  update(id: number, jugadorLiga: Partial<JugadorLiga>): Observable<JugadorLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, jugadorLiga).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarJugadorLiga(data);
      })
    );
  }

  /**
   * PUT /api/liga/jugadores/:id/confirmar-pago - Confirmar pago (protegido)
   */
  confirmarPago(id: number, monto_pagado?: number): Observable<JugadorLiga> {
    const body = monto_pagado !== undefined ? { monto_pagado } : {};
    return this.http.put<any>(`${this.apiUrl}/${id}/confirmar-pago`, body).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarJugadorLiga(data);
      })
    );
  }

  /**
   * DELETE /api/liga/jugadores/:id - Eliminar inscripción (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}

