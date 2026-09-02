import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { Patrocinador } from '../models/patrocinador';

@Injectable({
  providedIn: 'root'
})
export class PatrocinadorService {
  private apiUrl = `${environment.apiUrl}/patrocinadores`;

  constructor(private http: HttpClient) {}

  private mapear(raw: any): Patrocinador {
    return {
      idPatrocinador: raw.idPatrocinador,
      nombre: raw.nombre,
      logoUrl: raw.logo_url ?? raw.logoUrl,
      sitioWeb: raw.sitio_web ?? raw.sitioWeb,
      descripcion: raw.descripcion,
      contacto: raw.contacto,
      activo: raw.activo,
      fechaRegistro: raw.fecha_registro ?? raw.fechaRegistro,
      actualizacion: raw.actualizacion,
    };
  }

  getAll(activo?: boolean): Observable<Patrocinador[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response.data ?? []);
        return data.map((item: any) => this.mapear(item));
      }),
      catchError(() => of([]))
    );
  }

  getById(id: number): Observable<Patrocinador> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapear(response.data || response))
    );
  }

  create(datos: Partial<Patrocinador>): Observable<Patrocinador> {
    const payload = {
      nombre: datos.nombre,
      logo_url: datos.logoUrl ?? null,
      sitio_web: datos.sitioWeb ?? null,
      descripcion: datos.descripcion ?? null,
      contacto: datos.contacto ?? null,
      activo: datos.activo ?? true,
    };
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(response => this.mapear(response.data || response))
    );
  }

  update(id: number, datos: Partial<Patrocinador>): Observable<Patrocinador> {
    const payload = {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.logoUrl !== undefined && { logo_url: datos.logoUrl }),
      ...(datos.sitioWeb !== undefined && { sitio_web: datos.sitioWeb }),
      ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
      ...(datos.contacto !== undefined && { contacto: datos.contacto }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(response => this.mapear(response.data || response))
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  toggleActivo(id: number): Observable<Patrocinador> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map(response => this.mapear(response.data || response))
    );
  }
}
