import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { RolUsuario } from '../models/usuario';

/**
 * Restringe rutas hijas de /main-view según route.data.roles.
 * Convive con authGuard (que solo valida autenticación): este guard
 * asume que ya hay un usuario autenticado y decide si su rol alcanza.
 * Una ruta sin data.roles queda abierta a cualquier rol autenticado.
 */
export const roleGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as RolUsuario[] | undefined;
  const usuario = auth.currentUserValue;

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  if (!allowedRoles || allowedRoles.includes(usuario.rol as RolUsuario)) {
    return true;
  }

  router.navigate(['/main-view/no-autorizado']);
  return false;
};
