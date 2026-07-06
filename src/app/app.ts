import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SessionMonitorService } from './services/session-monitor';
import { AuthService } from './services/auth';
import { ModalSesionCerradaComponent } from './componentes/modales/sesion-cerrada/sesion-cerrada';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ModalSesionCerradaComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'chess-admin';
  mostrarModalSesionCerrada$!: Observable<boolean>;

  constructor(
    private sessionMonitor: SessionMonitorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Inicializar el observable del modal
    this.mostrarModalSesionCerrada$ = this.sessionMonitor.mostrarModal$;
    
    // Si ya hay una sesión activa al cargar la app, verificar e iniciar monitoreo
    if (this.authService.isAuthenticated()) {
      
      // IMPORTANTE: Verificar inmediatamente si la sesión es válida
      this.sessionMonitor.verificarSesionInmediata();
      
      // Luego iniciar monitoreo continuo
      this.sessionMonitor.startMonitoring();
    } 

    // Escuchar eventos de inicio de sesión
    window.addEventListener('session-started', () => {
      this.sessionMonitor.startMonitoring();
    });

    // Escuchar eventos de cierre de sesión
    window.addEventListener('session-ended', () => {
      this.sessionMonitor.stopMonitoring();
    });
  }

  /**
   * Detectar cuando el usuario vuelve a la pestaña
   * Útil para verificar la sesión cuando cambian de pestaña
   */
  @HostListener('window:focus')
  onWindowFocus(): void {
    
    if (this.authService.isAuthenticated()) {
      // Verificar la sesión cuando el usuario vuelve a la pestaña
      this.sessionMonitor.verificarSesionInmediata();
    }
  }

  /**
   * Detectar cuando la página se vuelve visible
   * Funciona mejor en mobile y algunos navegadores
   */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      
      if (this.authService.isAuthenticated()) {
        this.sessionMonitor.verificarSesionInmediata();
      }
    }
  }

  onModalContinuar(): void {
    this.sessionMonitor.cerrarModalYRedirigir();
  }

  ngOnDestroy(): void {
    this.sessionMonitor.stopMonitoring();
  }
}
