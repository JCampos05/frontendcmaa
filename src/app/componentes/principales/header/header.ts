import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  showProfileMenu = false;
  currentUser: any = null;
  cerrando = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  goToConfig(): void {
    this.router.navigate(['/main-view/configuracion']);
    this.closeProfileMenu();
  }

  logout(): void {
    if (this.cerrando) {
      return;
    }
    
    this.cerrando = true;
    this.closeProfileMenu();
    
    //console.log('Token antes de logout:', this.authService.getToken() ? 'Existe' : 'No existe');

    this.authService.logout().subscribe({
      next: (response) => {
        
        // Verificar que el token fue eliminado
        const tokenDespues = this.authService.getToken();
        //console.log('Token después de logout:', tokenDespues ? 'AÚN EXISTE ❌' : 'Eliminado ✅');
        
        if (tokenDespues) {
          //console.error('⚠️ PROBLEMA: El token no se eliminó correctamente');
          // Forzar limpieza
          this.authService.logoutLocal();
        }
        
        // Navegar al login
        //console.log('🏠 Navegando a /login...');
        this.router.navigate(['/login']).then(() => {
          //console.log('✅ Navegación completada');
          this.cerrando = false;
        });
      },
      error: (error) => {
        console.error('❌ Error en logout:', error);
        
        // Verificar token de todos modos
        const tokenDespues = this.authService.getToken();
        //console.log('Token después del error:', tokenDespues ? 'Existe' : 'Eliminado');
        
        // Navegar de todos modos
        this.router.navigate(['/login']).then(() => {
          this.cerrando = false;
        });
      }
    });
  }
}
