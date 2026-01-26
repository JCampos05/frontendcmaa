import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';

export interface InscripcionAdminData {
    // Datos del jugador
    idJugador?: number;
    nombre?: string;
    apellido1?: string;
    apellido2?: string;
    telefono?: string;
    fecha_nacimiento?: string;
    
    // Tipo de inscripción
    tipo: 'torneo' | 'liga';
    
    // Para Torneos
    idTorneo?: number;
    idCategoria?: number;
    
    // Para Ligas
    idLiga?: number;
    idGrupoLiga?: number;
    
    // Datos comunes
    notas?: string;
    pago_confirmado?: boolean;
    monto_pagado?: number;
    rating_inicial?: number;
    numero_jugador?: number;
    posicion?: number;
}

export interface EventoActivo {
    tipo: 'torneo' | 'liga';
    id: number;
    nombre: string;
    lugar?: string;
    fecha?: Date | string;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    categorias?: any[];
    grupos?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class InscripcionAdminService {
    private apiUrl = `${environment.apiUrl}/inscripciones-admin`;

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
     * POST /api/liga/inscripciones-admin - Crear inscripción administrativa
     */
    create(data: InscripcionAdminData): Observable<any> {
        return this.http.post<any>(this.apiUrl, data).pipe(
            map(response => {
                const result = response.data || response;
                
                // Normalizar fechas según el tipo
                if (result.fecha_inscripcion) {
                    result.fecha_inscripcion = this.normalizarFecha(result.fecha_inscripcion);
                }
                if (result.fecha_actualizacion) {
                    result.fecha_actualizacion = this.normalizarFecha(result.fecha_actualizacion);
                }
                
                return response;
            })
        );
    }

    /**
     * GET /api/liga/inscripciones-admin/eventos-activos - Obtener torneos y ligas activos
     */
    getEventosActivos(): Observable<{ torneos: EventoActivo[], ligas: EventoActivo[] }> {
        return this.http.get<any>(`${this.apiUrl}/eventos-activos`).pipe(
            map(response => {
                const data = response.data || response;
                
                // Normalizar fechas de torneos
                if (data.torneos) {
                    data.torneos = data.torneos.map((torneo: any) => ({
                        ...torneo,
                        fecha: this.normalizarFecha(torneo.fecha)
                    }));
                }
                
                // Normalizar fechas de ligas
                if (data.ligas) {
                    data.ligas = data.ligas.map((liga: any) => ({
                        ...liga,
                        fecha_inicio: this.normalizarFecha(liga.fecha_inicio),
                        fecha_fin: this.normalizarFecha(liga.fecha_fin)
                    }));
                }
                
                return data;
            })
        );
    }

    /**
     * GET /api/liga/inscripciones-admin/torneo/:idTorneo/categorias - Obtener categorías de torneo
     */
    getCategoriasByTorneo(idTorneo: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}/categorias`).pipe(
            map(response => response.data || response || [])
        );
    }

    /**
     * GET /api/liga/inscripciones-admin/liga/:idLiga/grupos - Obtener grupos de liga
     */
    getGruposByLiga(idLiga: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}/grupos`).pipe(
            map(response => response.data || response || [])
        );
    }
}