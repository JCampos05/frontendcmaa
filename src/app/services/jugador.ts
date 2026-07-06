import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { Jugador } from '../models/jugador';

@Injectable({
  providedIn: 'root'
})
export class JugadorService {
  private apiUrl = `${environment.apiUrl}/jugadores`;

  constructor(private http: HttpClient) { }

  /**
   * Función auxiliar para normalizar fechas
   * Convierte fechas del formato backend a objetos Date correctos sin problemas de zona horaria
   */
  private normalizarFecha(fecha: string | Date | null | undefined): Date | null {
    if (!fecha) return null;
    
    if (typeof fecha === 'string') {
      // Si la fecha viene en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
      // Extraemos solo la parte de la fecha para evitar problemas de zona horaria
      const fechaSolo = fecha.split('T')[0];
      const [year, month, day] = fechaSolo.split('-').map(Number);
      
      // Crear fecha en hora local (sin ajustes de zona horaria)
      return new Date(year, month - 1, day);
    }
    
    return new Date(fecha);
  }

  /**
   * Función auxiliar para transformar datos de torneo
   */
  private transformarTorneo(torneo: any): any {
    if (!torneo) return null;
    
    return {
      ...torneo,
      fecha: this.normalizarFecha(torneo.fecha)
    };
  }

  /**
   * Función auxiliar para transformar inscripción con datos relacionados
   */
  private transformarInscripcion(inscripcion: any): any {
    if (!inscripcion) return null;
    
    return {
      ...inscripcion,
      fecha_inscripcion: this.normalizarFecha(inscripcion.fecha_inscripcion),
      fecha_actualizacion: this.normalizarFecha(inscripcion.fecha_actualizacion),
      torneo: this.transformarTorneo(inscripcion.torneo)
    };
  }

  /**
   * Función auxiliar para transformar datos de liga
   */
  private transformarLiga(liga: any): any {
    if (!liga) return null;
    
    return {
      ...liga,
      fecha_inicio: this.normalizarFecha(liga.fecha_inicio),
      fecha_fin: this.normalizarFecha(liga.fecha_fin),
      cierre_inscripciones: this.normalizarFecha(liga.cierre_inscripciones),
      fecha_creacion: this.normalizarFecha(liga.fecha_creacion),
      fecha_actualizacion: this.normalizarFecha(liga.fecha_actualizacion)
    };
  }

  /**
   * Función auxiliar para transformar inscripción de liga con datos relacionados
   */
  private transformarInscripcionLiga(inscripcionLiga: any): any {
    if (!inscripcionLiga) return null;
    
    return {
      ...inscripcionLiga,
      fecha_inscripcion: this.normalizarFecha(inscripcionLiga.fecha_inscripcion),
      fecha_actualizacion: this.normalizarFecha(inscripcionLiga.fecha_actualizacion),
      liga: this.transformarLiga(inscripcionLiga.liga),
      grupo: inscripcionLiga.grupo ? {
        ...inscripcionLiga.grupo,
        fecha_creacion: this.normalizarFecha(inscripcionLiga.grupo.fecha_creacion),
        fecha_actualizacion: this.normalizarFecha(inscripcionLiga.grupo.fecha_actualizacion)
      } : null
    };
  }

  /**
   * GET /api/jugadores - Obtener todos los jugadores (protegido)
   * Acepta parámetros de filtrado opcionales
   */
  getAll(params?: any): Observable<Jugador[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/jugadores/stats - Obtener estadísticas de jugadores (protegido)
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * GET /api/jugadores/:id - Obtener jugador por ID (protegido)
   */
  getById(id: number): Observable<Jugador> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/jugadores - Crear jugador (protegido)
   */
  create(jugador: Partial<Jugador>): Observable<Jugador> {
    return this.http.post<any>(this.apiUrl, jugador).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/jugadores/:id - Actualizar jugador (protegido)
   */
  update(id: number, jugador: Partial<Jugador>): Observable<Jugador> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, jugador).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/jugadores/:id - Eliminar jugador (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * GET /api/jugadores/search - Buscar jugadores por nombre (público)
   */
  search(nombre?: string, apellido1?: string, apellido2?: string): Observable<Jugador[]> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (apellido1) params = params.set('apellido1', apellido1);
    if (apellido2) params = params.set('apellido2', apellido2);

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/jugadores/:id/stats - Obtener estadísticas públicas de un jugador
   * TRANSFORMACIÓN DE FECHAS
   */
  getPublicStats(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/stats`).pipe(
      map(response => {
        const data = response.data || response;
        
        //console.log('📥 Datos crudos recibidos:', data);
        
        // Transformar último torneo si existe
        if (data.ultimoTorneo) {
          data.ultimoTorneo = this.transformarInscripcion(data.ultimoTorneo);
        }
        
        // Transformar historial completo
        if (data.historial && Array.isArray(data.historial)) {
          data.historial = data.historial.map((inscripcion: any) => 
            this.transformarInscripcion(inscripcion)
          );
        }
        
        // Transformar ligas si existen
        if (data.ligas && Array.isArray(data.ligas)) {
          data.ligas = data.ligas.map((inscripcionLiga: any) => 
            this.transformarInscripcionLiga(inscripcionLiga)
          );
        }
        
        // Transformar fechas del jugador
        if (data.jugador) {
          if (data.jugador.fecha_nacimiento) {
            data.jugador.fecha_nacimiento = this.normalizarFecha(data.jugador.fecha_nacimiento);
          }
          if (data.jugador.fecha_registro) {
            data.jugador.fecha_registro = this.normalizarFecha(data.jugador.fecha_registro);
          }
        }        
        return data;
      })
    );
  }

  /**
   * GET /api/jugadores/:id/full - Obtener jugador completo con todas las relaciones (protegido)
   */
  getFullById(id: number): Observable<Jugador> {
    return this.http.get<any>(`${this.apiUrl}/${id}/full`).pipe(
      map(response => {
        const data = response.data || response;
        return data;
      })
    );
  }
}

