import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    //console.log('🔒 Token agregado a la petición');
  } else {
    //console.warn('⚠️ No hay token disponible');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const errorMessage = error.error?.message || '';
        //console.error('❌ Error 401: No autorizado -', errorMessage);
        
        // Verificar si es por sesión inválida o expirada
        if (errorMessage.includes('Sesión inválida') || 
            errorMessage.includes('Sesión expirada') ||
            errorMessage.includes('Token expirado')) {
          console.warn('⚠️ Sesión cerrada remotamente o expirada');
        }
        
        // CRÍTICO: No llamar a logout() que hace petición HTTP
        // Solo limpiar localmente para evitar bucle infinito
        authService.logoutLocal();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};