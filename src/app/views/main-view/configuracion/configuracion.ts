import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario';
import { AuthService } from '../../../services/auth';
import { HistorialAccesoService } from '../../../services/historial-acceso';
import { SesionesActivasService } from '../../../services/sesiones-activas';
import { LogsSistemaService } from '../../../services/logs-sistema';
import { ConfigGralService } from '../../../services/config-gral';
import { Usuario } from '../../../models/usuario';
import { HistorialAcceso, EstadisticasAcceso } from '../../../models/historial-acceso';
import { SesionActiva } from '../../../models/sesion-activa';
import { LogSistema, EstadisticasLogs } from '../../../models/log-sistema';
import { ConfigGral } from '../../../models/config-gral';
import { ZonaHoraria } from '../../../models/zona-horaria';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { Router } from '@angular/router';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

interface UsuarioExtendido extends Usuario {
  mostrarPassword?: boolean;
}

interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface FormularioConfig {
  nombreComite: string;
  descripcion: string;
  telefono: string;
  email: string;
  ciudad: string;
  estado: string;
  pais: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  whatsapp: string;
  idZonaHoraria: number | null;
  diasAutoDesactivar: number;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalConfirmacionComponent],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  usuarios: UsuarioExtendido[] = [];
  usuarioActual: Usuario | null = null;
  cargando = false;
  error: string | null = null;

  seccionActiva: 'usuarios' | 'historial' | 'sesiones' | 'logs' | 'config' = 'usuarios';

  modalAbierto = false;
  modoModal: 'crear' | 'editar' | 'cambiarPassword' | 'eliminar' = 'crear';
  usuarioSeleccionado: UsuarioExtendido | null = null;

  toastMessage: ToastMessage | null = null;

  modalConfirmacion = {
    mostrar: false,
    titulo: '',
    mensaje: '',
    mensajeSecundario: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    tipoBoton: 'primary' as 'primary' | 'danger' | 'secondary',
    icono: 'fa-circle-question',
    iconoBoton: 'fa-check',
    tipoAdvertencia: false,
    accion: null as (() => void) | null
  };

  formulario = {
    telefono: '',
    password: '',
    passwordConfirm: ''
  };

  formularioPassword = {
    passwordActual: '',
    passwordNuevo: '',
    passwordNuevoConfirm: ''
  };

  historialAccesos: HistorialAcceso[] = [];
  estadisticasAcceso: EstadisticasAcceso | null = null;
  paginaHistorial = 1;
  totalPaginasHistorial = 1;
  totalHistorial = 0;
  limitePorPaginaHistorial = 15;

  sesionesActivas: SesionActiva[] = [];

  logs: LogSistema[] = [];
  estadisticasLogs: EstadisticasLogs | null = null;
  paginaLogs = 1;
  totalPaginasLogs = 1;
  totalLogs = 0;
  limitePorPaginaLogs = 15;
  filtrosLogs = {
    nivel: '',
    entidad: '',
    accion: ''
  };

  // ── Configuración General ──────────────────────────────────────
  configGral: ConfigGral | null = null;
  zonasHorarias: ZonaHoraria[] = [];
  cargandoConfig = false;
  guardandoConfig = false;
  errorConfig: string | null = null;
  formularioConfig: FormularioConfig = {
    nombreComite: '',
    descripcion: '',
    telefono: '',
    email: '',
    ciudad: '',
    estado: '',
    pais: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    whatsapp: '',
    idZonaHoraria: null,
    diasAutoDesactivar: 30
  };

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private historialService: HistorialAccesoService,
    private sesionesService: SesionesActivasService,
    private logsService: LogsSistemaService,
    private configGralService: ConfigGralService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuarioActual = this.authService.currentUserValue;

    if (this.usuarioActual?.rol !== 'adminGral') {
      this.router.navigate(['/main-view']);
      return;
    }

    this.cargarUsuarios();
  }

  get esAdminGral(): boolean {
    return this.usuarioActual?.rol === 'adminGral';
  }

  // ── Toast ──────────────────────────────────────────────────────
  private showToast(type: ToastMessage['type'], message: string): void {
    this.toastMessage = { type, message };
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  // ── Modal confirmación ─────────────────────────────────────────
  mostrarModalConfirmacion(config: Partial<typeof this.modalConfirmacion>): void {
    this.modalConfirmacion = {
      ...this.modalConfirmacion,
      ...config,
      mostrar: true
    };
  }

  cerrarModalConfirmacion(): void {
    this.modalConfirmacion.mostrar = false;
    this.modalConfirmacion.accion = null;
  }

  ejecutarAccionConfirmacion(): void {
    if (this.modalConfirmacion.accion) {
      this.modalConfirmacion.accion();
    }
    this.cerrarModalConfirmacion();
  }

  cambiarSeccion(seccion: 'usuarios' | 'historial' | 'sesiones' | 'logs' | 'config'): void {
    this.seccionActiva = seccion;

    if (seccion === 'usuarios') {
      this.cargarUsuarios();
    } else if (seccion === 'historial') {
      this.cargarHistorial();
    } else if (seccion === 'sesiones') {
      this.cargarSesiones();
    } else if (seccion === 'logs') {
      this.cargarLogs();
    } else if (seccion === 'config') {
      this.cargarConfig();
    }
  }

  // ── Usuarios ───────────────────────────────────────────────────
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    this.usuarioService.getAll().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.map(u => ({ ...u, mostrarPassword: false }));
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  // ── Historial ──────────────────────────────────────────────────
  cargarHistorial(): void {
    this.cargando = true;
    this.error = null;

    this.historialService.getAll(this.limitePorPaginaHistorial, this.paginaHistorial).subscribe({
      next: (response) => {
        this.historialAccesos = response.data;
        this.totalPaginasHistorial = response.totalPaginas;
        this.totalHistorial = response.total;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar historial de accesos';
        console.error('Error:', err);
        this.cargando = false;
      }
    });

    this.historialService.getEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticasAcceso = stats;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }

  // ── Sesiones ───────────────────────────────────────────────────
  cargarSesiones(): void {
    this.cargando = true;
    this.error = null;

    this.sesionesService.getActivas().subscribe({
      next: (sesiones) => {
        this.sesionesActivas = sesiones;
        this.cargando = false;
        this.verificarSesionActual(sesiones);
      },
      error: (err) => {
        if (err.status === 401) {
          console.error('Sesión cerrada remotamente detectada');
          this.authService.logoutLocal();
          this.router.navigate(['/login']);
          return;
        }

        this.error = 'Error al cargar sesiones activas';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  private verificarSesionActual(sesiones: SesionActiva[]): void {
    const tokenActual = this.authService.getToken();
    if (!tokenActual) {
      console.warn('No hay token actual');
      return;
    }

    const sesionActualActiva = sesiones.some(s => s.token === tokenActual);

    if (!sesionActualActiva) {
      console.warn('Tu sesión no está en la lista de sesiones activas');
      this.showToast('warning', 'Tu sesión ha sido cerrada desde otro dispositivo');
      this.toast.warning('Precaución', '');

      setTimeout(() => {
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  confirmarCerrarSesion(idSesion: number): void {
    const sesion = this.sesionesActivas.find(s => s.idSesion === idSesion);
    if (!sesion) {
      this.showToast('error', 'Sesión no encontrada');
      return;
    }

    if (this.esSesionActual(sesion)) {
      this.showToast('warning', 'No puedes cerrar tu sesión actual desde aquí. Usa el botón de cerrar sesión del menú principal.');
      return;
    }

    this.mostrarModalConfirmacion({
      titulo: 'Cerrar sesión',
      mensaje: '¿Estás seguro de que deseas cerrar esta sesión?',
      mensajeSecundario: 'El usuario será desconectado inmediatamente',
      textoConfirmar: 'Cerrar sesión',
      tipoBoton: 'danger',
      icono: 'fa-triangle-exclamation',
      iconoBoton: 'fa-circle-xmark',
      tipoAdvertencia: true,
      accion: () => this.cerrarSesion(idSesion)
    });
  }

  cerrarSesion(idSesion: number): void {
    this.cargando = true;

    this.sesionesService.cerrarSesion(idSesion).subscribe({
      next: () => {
        this.showToast('success', 'Sesión cerrada exitosamente');
        setTimeout(() => {
          this.cargarSesiones();
        }, 500);
      },
      error: (err) => {
        this.cargando = false;
        this.showToast('error', err.error?.message || 'Error al cerrar sesión');
        console.error('Error al cerrar sesión:', err);
      }
    });
  }

  confirmarLimpiarSesionesExpiradas(): void {
    this.mostrarModalConfirmacion({
      titulo: 'Limpiar sesiones expiradas',
      mensaje: '¿Deseas limpiar todas las sesiones expiradas del sistema?',
      mensajeSecundario: 'Esto marcará como inactivas todas las sesiones que ya hayan vencido',
      textoConfirmar: 'Limpiar',
      tipoBoton: 'secondary',
      icono: 'fa-broom',
      iconoBoton: 'fa-check',
      accion: () => this.limpiarSesionesExpiradas()
    });
  }

  limpiarSesionesExpiradas(): void {
    this.sesionesService.limpiarExpiradas().subscribe({
      next: (cantidad) => {
        this.showToast('info', `${cantidad} sesión(es) expirada(s) limpiada(s)`);
        this.cargarSesiones();
      },
      error: () => {
        this.showToast('error', 'Error al limpiar sesiones expiradas');
      }
    });
  }

  // ── Logs ───────────────────────────────────────────────────────
  cargarLogs(): void {
    this.cargando = true;
    this.error = null;

    const filtros = {
      nivel: this.filtrosLogs.nivel || undefined,
      entidad: this.filtrosLogs.entidad || undefined,
      accion: this.filtrosLogs.accion || undefined
    };

    this.logsService.getAll(this.limitePorPaginaLogs, this.paginaLogs, filtros).subscribe({
      next: (response) => {
        this.logs = response.data;
        this.totalPaginasLogs = response.totalPaginas;
        this.totalLogs = response.total;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar logs del sistema';
        this.cargando = false;
      }
    });

    this.logsService.getEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticasLogs = stats;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }

  cambiarPaginaLogs(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasLogs) return;
    this.paginaLogs = pagina;
    this.cargarLogs();
  }

  get paginasLogs(): number[] {
    return Array.from({ length: this.totalPaginasLogs }, (_, i) => i + 1);
  }

  aplicarFiltrosLogs(): void {
    this.paginaLogs = 1;
    this.cargarLogs();
  }

  limpiarFiltrosLogs(): void {
    this.filtrosLogs = { nivel: '', entidad: '', accion: '' };
    this.paginaLogs = 1;
    this.cargarLogs();
  }

  // ── Configuración General ──────────────────────────────────────
  cargarConfig(): void {
    if (!this.esAdminGral) return;

    this.cargandoConfig = true;
    this.errorConfig = null;

    this.configGralService.getZonasHorarias().subscribe({
      next: (zonas) => {
        this.zonasHorarias = zonas;
      },
      error: (err) => {
        console.error('Error al cargar zonas horarias:', err);
      }
    });

    this.configGralService.getCompleta().subscribe({
      next: (config) => {
        this.configGral = config;
        this.formularioConfig = {
          nombreComite:       config.nombreComite   ?? '',
          descripcion:        config.descripcion    ?? '',
          telefono:           config.telefono       ?? '',
          email:              config.email          ?? '',
          ciudad:             config.ciudad         ?? '',
          estado:             config.estado         ?? '',
          pais:               config.pais           ?? '',
          facebook:           config.facebook       ?? '',
          instagram:          config.instagram      ?? '',
          twitter:            config.twitter        ?? '',
          youtube:            config.youtube        ?? '',
          whatsapp:           config.whatsapp       ?? '',
          idZonaHoraria:      config.idZonaHoraria  ?? null,
          diasAutoDesactivar: config.diasAutoDesactivar ?? 30
        };
        this.cargandoConfig = false;
      },
      error: (err) => {
        this.errorConfig = 'Error al cargar la configuración';
        console.error('Error:', err);
        this.cargandoConfig = false;
      }
    });
  }

  private urlValida(valor: string): boolean {
    if (!valor) return true;
    try {
      new URL(valor);
      return true;
    } catch {
      return false;
    }
  }

  private emailValido(valor: string): boolean {
    if (!valor) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  private nullIfEmpty(valor: string): string | null {
    return valor.trim() === '' ? null : valor.trim();
  }

  guardarConfig(): void {
    if (!this.esAdminGral) return;

    const f = this.formularioConfig;

    if (!f.nombreComite.trim()) {
      this.showToast('error', 'El nombre del comité es requerido');
      return;
    }

    const diasNum = Number(f.diasAutoDesactivar);
    if (isNaN(diasNum) || diasNum < 1 || diasNum > 30) {
      this.showToast('error', 'Los días de auto-desactivación deben estar entre 1 y 30');
      return;
    }

    for (const campo of ['facebook', 'instagram', 'twitter', 'youtube'] as const) {
      if (f[campo] && !this.urlValida(f[campo])) {
        this.showToast('error', `La URL de ${campo} no es válida`);
        return;
      }
    }

    if (f.email && !this.emailValido(f.email)) {
      this.showToast('error', 'El correo electrónico no tiene un formato válido');
      return;
    }

    const payload: Partial<ConfigGral> = {
      nombreComite:       f.nombreComite.trim(),
      descripcion:        this.nullIfEmpty(f.descripcion) as any,
      telefono:           this.nullIfEmpty(f.telefono)    as any,
      email:              this.nullIfEmpty(f.email)       as any,
      ciudad:             this.nullIfEmpty(f.ciudad)      as any,
      estado:             this.nullIfEmpty(f.estado)      as any,
      pais:               this.nullIfEmpty(f.pais)        as any,
      facebook:           this.nullIfEmpty(f.facebook)    as any,
      instagram:          this.nullIfEmpty(f.instagram)   as any,
      twitter:            this.nullIfEmpty(f.twitter)     as any,
      youtube:            this.nullIfEmpty(f.youtube)     as any,
      whatsapp:           this.nullIfEmpty(f.whatsapp)    as any,
      idZonaHoraria:      f.idZonaHoraria                 as any,
      diasAutoDesactivar: diasNum
    };

    this.guardandoConfig = true;

    this.configGralService.update(payload).subscribe({
      next: (config) => {
        this.configGral = config;
        this.guardandoConfig = false;
        this.showToast('success', 'Configuración guardada correctamente');
      },
      error: (err) => {
        this.guardandoConfig = false;
        const msg = err.error?.mensaje || err.error?.message || 'Error al guardar la configuración';
        this.showToast('error', msg);
        console.error('Error al guardar config:', err);
      }
    });
  }

  // ── CRUD Usuarios ──────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modoModal = 'crear';
    this.usuarioSeleccionado = null;
    this.limpiarFormulario();
    this.modalAbierto = true;
  }

  abrirModalEditar(usuario: UsuarioExtendido): void {
    this.modoModal = 'editar';
    this.usuarioSeleccionado = usuario;
    this.formulario = {
      telefono: usuario.telefono,
      password: '',
      passwordConfirm: ''
    };
    this.modalAbierto = true;
  }

  abrirModalCambiarPassword(usuario: UsuarioExtendido): void {
    this.modoModal = 'cambiarPassword';
    this.usuarioSeleccionado = usuario;
    this.limpiarFormularioPassword();
    this.modalAbierto = true;
  }

  abrirModalEliminar(usuario: UsuarioExtendido): void {
    this.modoModal = 'eliminar';
    this.usuarioSeleccionado = usuario;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.usuarioSeleccionado = null;
    this.limpiarFormulario();
    this.limpiarFormularioPassword();
  }

  limpiarFormulario(): void {
    this.formulario = { telefono: '', password: '', passwordConfirm: '' };
  }

  limpiarFormularioPassword(): void {
    this.formularioPassword = { passwordActual: '', passwordNuevo: '', passwordNuevoConfirm: '' };
  }

  validarFormulario(): string | null {
    if (!this.formulario.telefono.trim()) {
      return 'El teléfono es requerido';
    }

    const telefonoLimpio = this.formulario.telefono.replace(/\s/g, '');
    if (!/^\d{10}$/.test(telefonoLimpio)) {
      return 'El teléfono debe tener exactamente 10 dígitos';
    }

    if (this.modoModal === 'crear' || this.formulario.password) {
      if (!this.formulario.password) {
        return 'La contraseña es requerida';
      }

      if (this.formulario.password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }

      if (this.formulario.password !== this.formulario.passwordConfirm) {
        return 'Las contraseñas no coinciden';
      }
    }

    return null;
  }

  validarFormularioPassword(): string | null {
    if (!this.formularioPassword.passwordActual) {
      return 'La contraseña actual es requerida';
    }

    if (!this.formularioPassword.passwordNuevo) {
      return 'La contraseña nueva es requerida';
    }

    if (this.formularioPassword.passwordNuevo.length < 6) {
      return 'La contraseña nueva debe tener al menos 6 caracteres';
    }

    if (this.formularioPassword.passwordNuevo !== this.formularioPassword.passwordNuevoConfirm) {
      return 'Las contraseñas nuevas no coinciden';
    }

    return null;
  }

  guardarUsuario(): void {
    const errorValidacion = this.validarFormulario();
    if (errorValidacion) {
      this.showToast('error', errorValidacion);
      return;
    }

    this.cargando = true;

    const datosUsuario: Partial<Usuario> = {
      telefono: this.formulario.telefono.trim()
    };

    if (this.formulario.password) {
      datosUsuario.password = this.formulario.password;
    }

    const operacion = this.modoModal === 'crear'
      ? this.usuarioService.create(datosUsuario)
      : this.usuarioService.update(this.usuarioSeleccionado!.idUsuario!, datosUsuario);

    operacion.subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarModal();
        this.showToast('success',
          this.modoModal === 'crear'
            ? 'Usuario creado exitosamente'
            : 'Usuario actualizado exitosamente'
        );
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Error al guardar usuario');
        this.cargando = false;
      }
    });
  }

  cambiarPassword(): void {
    const errorValidacion = this.validarFormularioPassword();
    if (errorValidacion) {
      this.showToast('error', errorValidacion);
      return;
    }

    this.cargando = true;

    this.usuarioService.cambiarPassword(
      this.usuarioSeleccionado!.idUsuario!,
      this.formularioPassword.passwordActual,
      this.formularioPassword.passwordNuevo
    ).subscribe({
      next: () => {
        this.cerrarModal();
        this.showToast('success', 'Contraseña cambiada exitosamente');
        this.cargando = false;
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Error al cambiar contraseña');
        this.cargando = false;
      }
    });
  }

  eliminarUsuario(): void {
    if (!this.usuarioSeleccionado) return;

    if (this.usuarioSeleccionado.idUsuario === this.usuarioActual?.idUsuario) {
      this.showToast('warning', 'No puedes eliminar tu propio usuario');
      return;
    }

    this.cargando = true;

    this.usuarioService.delete(this.usuarioSeleccionado.idUsuario!).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarModal();
        this.showToast('success', 'Usuario eliminado exitosamente');
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Error al eliminar usuario');
        this.cargando = false;
      }
    });
  }

  // ── Utilidades ─────────────────────────────────────────────────
  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'No disponible';

    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'Fecha inválida';

      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Error al formatear';
    }
  }

  formatearFechaCorta(fecha: Date | string | undefined): string {
    if (!fecha) return 'N/A';

    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  getTipoAccesoClase(tipo: string): string {
    const clases: { [key: string]: string } = {
      'login_exitoso': 'tipo-exitoso',
      'login_fallido': 'tipo-fallido',
      'logout': 'tipo-logout',
      'otro': 'tipo-otro'
    };
    return clases[tipo] || 'tipo-otro';
  }

  getNivelLogClase(nivel: string): string {
    const clases: { [key: string]: string } = {
      'info': 'nivel-info',
      'warning': 'nivel-warning',
      'error': 'nivel-error',
      'otro': 'nivel-otro'
    };
    return clases[nivel] || 'nivel-otro';
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return usuario.idUsuario === this.usuarioActual?.idUsuario;
  }

  esSesionActual(sesion: SesionActiva): boolean {
    try {
      if (!this.authService) return false;
      const tokenActual = this.authService.getToken();
      if (!tokenActual) return false;
      return sesion.token === tokenActual;
    } catch {
      return false;
    }
  }

  cambiarPaginaHistorial(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasHistorial) return;
    this.paginaHistorial = pagina;
    this.cargarHistorial();
  }

  get paginasHistorial(): number[] {
    return Array.from({ length: this.totalPaginasHistorial }, (_, i) => i + 1);
  }
}
