import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //console.log('🔐 AuthGuard: Verificando autenticación...');
  
  const isAuth = authService.isAuthenticated();
  //console.log('Estado de autenticación:', isAuth ? 'Autenticado ✅' : 'No autenticado ❌');

  if (isAuth) {
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/login']);
  return false;
};