import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Torneo } from '../../models/torneo';

@Injectable({
  providedIn: 'root'
})
export class TorneoService {
  private apiUrl = `${environment.apiUrl}/torneos`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/torneos/activos - Obtener torneos activos (público)
   */
  getActivos(): Observable<Torneo[]> {
    return this.http.get<any>(`${this.apiUrl}/activos`).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/torneos/proximos - Obtener próximos torneos (público)
   */
  getUpcoming(): Observable<Torneo[]> {
    return this.http.get<any>(`${this.apiUrl}/proximos`).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/torneos/:id/categorias - Obtener categorías de un torneo (público)
   */
  getCategoriasByTorneo(torneoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${torneoId}/categorias`).pipe(
      map(response => {
        console.log('Respuesta RAW de categorías:', response);
        
        // El backend devuelve { success: true, categorias: [...], total: N }
        // donde categorias viene de categorias_torneo con through attributes
        if (response.success && response.categorias) {
          const categoriasTransformadas = response.categorias.map((cat: any) => {
            // El backend devuelve:
            // { idCategoria, nombre, costo, torneo_categoria: { rondas, ... } }
            // donde torneo_categoria son los datos de la tabla intermedia
            
            // Extraer datos de la tabla intermedia (puede venir como torneo_categoria)
            const datosIntermedia = cat.torneo_categoria || cat.TorneoCategoria || {};
            
            return {
              idTorneoCat: datosIntermedia.idTorneoCat || null,
              idTorneo: torneoId,
              idCategoria: cat.idCategoria,
              rondas: datosIntermedia.rondas || 5,
              ritmo_juego: datosIntermedia.ritmo_juego || null,
              ritmoJuego: datosIntermedia.ritmo_juego || null,
              sistema_competencia: datosIntermedia.sistema_competencia || null,
              sistemaCompetencia: datosIntermedia.sistema_competencia || null,
              calendario: datosIntermedia.calendario || null,
              premios: datosIntermedia.premios || null,
              desempates: datosIntermedia.desempates || null,
              activo: datosIntermedia.activo !== undefined ? datosIntermedia.activo : true,
              categoria: {
                idCategoria: cat.idCategoria,
                nombre: cat.nombre,
                costo: cat.costo
              }
            };
          });
          
          console.log('Categorías transformadas:', categoriasTransformadas);
          return { success: true, categorias: categoriasTransformadas };
        }
        
        console.warn('No se encontraron categorías en la respuesta');
        return { success: true, categorias: [] };
      }),
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return of({ success: false, categorias: [] });
      })
    );
  }

  /**
   * GET /api/torneos/:id - Obtener torneo por ID (público)
   */
  getById(id: number): Observable<Torneo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const torneo = response.data || response;
        
        // Convertir snake_case a camelCase para campos específicos
        if (torneo.cierre_inscripciones && !torneo.cierreInscripciones) {
          torneo.cierreInscripciones = torneo.cierre_inscripciones;
        }
        
        // Normalizar el alias de categorías
        if (torneo.torneo_categorias && !torneo.torneoCategoria) {
          torneo.torneoCategoria = torneo.torneo_categorias;
        }
        
        // Parsear campos JSON si vienen como strings
        if (torneo.torneoCategoria && Array.isArray(torneo.torneoCategoria)) {
          torneo.torneoCategoria = torneo.torneoCategoria.map((tc: any) => {
            // Parsear calendario
            if (tc.calendario && typeof tc.calendario === 'string') {
              try {
                tc.calendario = JSON.parse(tc.calendario);
              } catch (e) {
                console.error('Error parseando calendario:', e);
                tc.calendario = [];
              }
            }
            // Parsear premios
            if (tc.premios && typeof tc.premios === 'string') {
              try {
                tc.premios = JSON.parse(tc.premios);
              } catch (e) {
                console.error('Error parseando premios:', e);
                tc.premios = {};
              }
            }
            // Parsear desempates
            if (tc.desempates && typeof tc.desempates === 'string') {
              try {
                tc.desempates = JSON.parse(tc.desempates);
              } catch (e) {
                console.error('Error parseando desempates:', e);
                tc.desempates = [];
              }
            }
            // Convertir snake_case a camelCase
            if (tc.ritmo_juego && !tc.ritmoJuego) {
              tc.ritmoJuego = tc.ritmo_juego;
            }
            if (tc.sistema_competencia && !tc.sistemaCompetencia) {
              tc.sistemaCompetencia = tc.sistema_competencia;
            }
            return tc;
          });
        }
        
        return torneo;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/torneos - Obtener todos los torneos (protegido)
   */
  getAll(activo?: boolean): Observable<Torneo[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/torneos - Crear torneo (protegido)
   */
  create(torneo: Partial<Torneo>): Observable<Torneo> {
    return this.http.post<any>(this.apiUrl, torneo).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /api/torneos/:id - Actualizar torneo (protegido)
   */
  update(id: number, torneo: Partial<Torneo>): Observable<Torneo> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, torneo).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/torneos/:id - Eliminar torneo (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * PATCH /api/torneos/:id/toggle - Activar/desactivar torneo (protegido)
   */
  toggleActive(id: number, activo: boolean): Observable<Torneo> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { activo }).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos inválidos';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('Error en TorneoService:', error);
    return throwError(() => ({ error: { message: errorMessage }, status: error.status }));
  }
}