import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { ConfigGral } from '../models/config-gral';
import { ZonaHoraria } from '../models/zona-horaria';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigGralService {
  private apiUrl = `${environment.apiUrl}/config`;

  constructor(private http: HttpClient) {}

  getCompleta(): Observable<ConfigGral> {
    return this.http.get<ApiResponse<ConfigGral>>(`${this.apiUrl}/completa`).pipe(
      map(r => r.data)
    );
  }

  update(datos: Partial<ConfigGral>): Observable<ConfigGral> {
    return this.http.patch<ApiResponse<ConfigGral>>(this.apiUrl, datos).pipe(
      map(r => r.data)
    );
  }

  getZonasHorarias(): Observable<ZonaHoraria[]> {
    return this.http.get<ApiResponse<ZonaHoraria[]>>(`${this.apiUrl}/zonas-horarias`).pipe(
      map(r => r.data)
    );
  }
}
