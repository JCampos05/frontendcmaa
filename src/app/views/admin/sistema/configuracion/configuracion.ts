import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { UsuarioService } from '../../../../services/usuario';
import { AuthService } from '../../../../services/auth';
import { HistorialAccesoService } from '../../../../services/historial-acceso';
import { SesionesActivasService } from '../../../../services/sesiones-activas';
import { LogsSistemaService } from '../../../../services/logs-sistema';
import { ConfigGralService } from '../../../../services/config-gral';
import { PatrocinadorService } from '../../../../services/patrocinador';
import { TorneoService } from '../../../../services/torneo';
import { Usuario } from '../../../../models/usuario';
import { HistorialAcceso, EstadisticasAcceso } from '../../../../models/historial-acceso';
import { SesionActiva } from '../../../../models/sesion-activa';
import { LogSistema, EstadisticasLogs } from '../../../../models/log-sistema';
import { ConfigGral } from '../../../../models/config-gral';
import { ZonaHoraria } from '../../../../models/zona-horaria';
import { Patrocinador } from '../../../../models/patrocinador';
import { Torneo } from '../../../../models/torneo';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { BadgeComponent } from '../../../../componentes/atoms/badge/badge';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { DataTableComponent, DataTableColumn } from '../../../../componentes/organisms/data-table/data-table';

interface UsuarioExtendido extends Usuario {
  mostrarPassword?: boolean;
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
  imports: [
    CommonModule, FormsModule, ModalConfirmacionComponent, ToastNoti,
    PageHeaderComponent, ButtonComponent, IconButtonComponent, IconComponent, BadgeComponent,
    StateMessageComponent, EmptyStateComponent, DataTableComponent
  ],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  usuarios: UsuarioExtendido[] = [];
  usuarioActual: Usuario | null = null;
  cargando = false;
  error: string | null = null;

  seccionActiva: 'usuarios' | 'patrocinadores' | 'acceso' | 'logs' | 'general' = 'general';
  subSeccionAcceso: 'historial' | 'sesiones' = 'historial';

  readonly columnasUsuarios: DataTableColumn[] = [
    { key: 'idUsuario', label: 'ID' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'rol', label: 'Rol' },
    { key: 'fechaRegistro', label: 'Fecha Registro' },
    { key: 'acciones', label: 'Acciones', align: 'center' }
  ];

  readonly columnasPatrocinadores: DataTableColumn[] = [
    { key: 'idPatrocinador', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'sitioWeb', label: 'Sitio Web' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'estado', label: 'Estado', align: 'center' },
    { key: 'acciones', label: 'Acciones', align: 'center' }
  ];

  readonly columnasHistorial: DataTableColumn[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'ip', label: 'IP' },
    { key: 'navegador', label: 'Navegador' },
    { key: 'dispositivo', label: 'Dispositivo' }
  ];

  readonly columnasLogs: DataTableColumn[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'nivel', label: 'Nivel' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'accion', label: 'Acción' },
    { key: 'entidad', label: 'Entidad' },
    { key: 'detalles', label: 'Detalles' }
  ];

  modalAbierto = false;
  modoModal: 'crear' | 'editar' | 'cambiarPassword' | 'eliminar' = 'crear';
  usuarioSeleccionado: UsuarioExtendido | null = null;

  modalConfirmacion = {
    mostrar: false,
    titulo: '',
    mensaje: '',
    mensajeSecundario: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    tipoBoton: 'primary' as 'primary' | 'danger' | 'secondary',
    icono: 'ph-question',
    iconoBoton: 'ph-check',
    tipoAdvertencia: false,
    accion: null as (() => void) | null
  };

  formulario = {
    telefono: '',
    password: '',
    passwordConfirm: '',
    rol: 'adminTorneo' as 'adminGral' | 'adminTorneo'
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
    accion: '',
    mes: ''         // mes APLICADO al query
  };
  mesInputLogs = this.mesActual();   // valor del <input type="month"> ---- no aplicado aún

  filtrosHistorial = {
    tipo: '',
    mes: ''         // mes APLICADO al query
  };
  mesInputHistorial = this.mesActual();   // valor del <input type="month"> ---- no aplicado aún

  private mesActual(): string {
    const hoy = new Date();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${hoy.getFullYear()}-${m}`;
  }

  // ---------- Patrocinadores ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  patrocinadores: Patrocinador[] = [];
  patrocinadorSeleccionado: Patrocinador | null = null;
  mostrandoFormPatrocinador = false;
  editandoPatrocinador = false;
  formularioPatrocinador = {
    nombre: '',
    logoUrl: '',
    sitioWeb: '',
    descripcion: '',
    contacto: ''
  };

  // ---------- Torneos asignados a usuario ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  usuarioConTorneos: UsuarioExtendido | null = null;
  torneosAsignados: Torneo[] = [];
  todosLosTorneos: Torneo[] = [];
  mostrandoPanelTorneos = false;
  cargandoTorneos = false;

  // ---------- Configuración General ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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
    private patrocinadorService: PatrocinadorService,
    private torneoService: TorneoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuarioActual = this.authService.currentUserValue;
    this.cargarConfig();
  }

  get esAdminGral(): boolean {
    return this.usuarioActual?.rol === 'adminGral';
  }

  // ---------- Toast ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  private showToast(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.toast[type](message);
  }

  // ---------- Modal confirmación -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

  cambiarSeccion(seccion: 'usuarios' | 'patrocinadores' | 'acceso' | 'logs' | 'general'): void {
    this.seccionActiva = seccion;
    this.mostrandoPanelTorneos = false;

    if (seccion === 'usuarios') {
      this.cargarUsuarios();
    } else if (seccion === 'patrocinadores') {
      this.cargarPatrocinadores();
    } else if (seccion === 'acceso') {
      this.cambiarSubSeccionAcceso('historial');
    } else if (seccion === 'logs') {
      this.cargarLogs();
    } else if (seccion === 'general') {
      this.cargarConfig();
    }
  }

  cambiarSubSeccionAcceso(sub: 'historial' | 'sesiones'): void {
    this.subSeccionAcceso = sub;
    if (sub === 'historial') {
      this.cargarHistorial();
    } else {
      this.cargarSesiones();
    }
  }

  // ---------- Usuarios ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    this.usuarioService.getAll().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.map((u: any) => ({
          ...u,
          fechaRegistro: u.fechaRegistro ?? u.fecha_registro,
          mostrarPassword: false
        }));
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  // ---------- Historial ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  cargarHistorial(): void {
    this.cargando = true;
    this.error = null;

    const { fechaInicio, fechaFin } = this.mesAFechas(this.filtrosHistorial.mes);
    const filtros = {
      tipo: this.filtrosHistorial.tipo || undefined,
      fechaInicio,
      fechaFin
    };

    this.historialService.getAll(this.limitePorPaginaHistorial, this.paginaHistorial, filtros).subscribe({
      next: (response) => {
        this.historialAccesos = response.data;
        this.totalPaginasHistorial = response.totalPaginas;
        this.totalHistorial = response.total;
        this.actualizarPaginacionHistorial();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar historial de accesos';
        console.error('Error:', err);
        this.cargando = false;
      }
    });

    this.historialService.getEstadisticas({ fechaInicio, fechaFin }).subscribe({
      next: (stats) => { this.estadisticasAcceso = stats; },
      error: () => {}
    });
  }

  aplicarFiltrosHistorial(): void {
    this.filtrosHistorial.mes = this.mesInputHistorial;
    this.paginaHistorial = 1;
    this.cargarHistorial();
  }

  limpiarFiltrosHistorial(): void {
    this.filtrosHistorial = { tipo: '', mes: '' };
    this.mesInputHistorial = this.mesActual();
    this.paginaHistorial = 1;
    this.cargarHistorial();
  }

  formatearMes(mes: string): string {
    if (!mes) return '';
    const [anio, m] = mes.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[Number(m) - 1]} ${anio}`;
  }

  private mesAFechas(mes: string): { fechaInicio?: string; fechaFin?: string } {
    if (!mes) return {};
    const [anio, m] = mes.split('-').map(Number);
    const inicio = new Date(anio, m - 1, 1);
    const fin = new Date(anio, m, 0, 23, 59, 59);
    return {
      fechaInicio: inicio.toISOString().slice(0, 10),
      fechaFin:    fin.toISOString().slice(0, 10)
    };
  }

  // ---------- Sesiones ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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
      icono: 'ph-warning',
      iconoBoton: 'ph-x-circle',
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
      icono: 'ph-broom',
      iconoBoton: 'ph-check',
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

  // ---------- Logs -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  cargarLogs(): void {
    this.cargando = true;
    this.error = null;

    const { fechaInicio, fechaFin } = this.mesAFechas(this.filtrosLogs.mes);
    const filtros = {
      nivel: this.filtrosLogs.nivel || undefined,
      entidad: this.filtrosLogs.entidad || undefined,
      accion: this.filtrosLogs.accion || undefined,
      fechaInicio,
      fechaFin
    };

    this.logsService.getAll(this.limitePorPaginaLogs, this.paginaLogs, filtros).subscribe({
      next: (response) => {
        this.logs = response.data;
        this.totalPaginasLogs = response.totalPaginas;
        this.totalLogs = response.total;
        this.actualizarPaginacionLogs();
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

  paginasLogs: number[] = [];
  primeraVisible_L = false;
  ultimaVisible_L = false;
  haySeparadorIzq_L = false;
  haySeparadorDer_L = false;

  private actualizarPaginacionLogs(): void {
    this.paginasLogs = this.ventanaPaginas(this.paginaLogs, this.totalPaginasLogs);
    this.primeraVisible_L = this.paginasLogs[0] > 1;
    this.ultimaVisible_L = this.paginasLogs[this.paginasLogs.length - 1] < this.totalPaginasLogs;
    this.haySeparadorIzq_L = this.paginasLogs[0] > 2;
    this.haySeparadorDer_L = this.paginasLogs[this.paginasLogs.length - 1] < this.totalPaginasLogs - 1;
  }

  private ventanaPaginas(actual: number, total: number, ventana = 5): number[] {
    if (total <= 1) return [];
    let start = Math.max(1, actual - Math.floor(ventana / 2));
    let end   = start + ventana - 1;
    if (end > total) { end = total; start = Math.max(1, end - ventana + 1); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  aplicarFiltrosLogs(): void {
    this.paginaLogs = 1;
    this.cargarLogs();
  }

  aplicarFiltrosLogsConMes(): void {
    this.filtrosLogs.mes = this.mesInputLogs;
    this.paginaLogs = 1;
    this.cargarLogs();
  }

  limpiarFiltrosLogs(): void {
    this.filtrosLogs = { nivel: '', entidad: '', accion: '', mes: '' };
    this.mesInputLogs = this.mesActual();
    this.paginaLogs = 1;
    this.cargarLogs();
  }

  // ---------- Configuración General ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

  // ---------- CRUD Usuarios --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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
      passwordConfirm: '',
      rol: (usuario.rol ?? 'adminTorneo') as 'adminGral' | 'adminTorneo'
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
    this.formulario = { telefono: '', password: '', passwordConfirm: '', rol: 'adminTorneo' };
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
      telefono: this.formulario.telefono.trim(),
      rol: this.formulario.rol
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

  // ---------- Patrocinadores ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  cargarPatrocinadores(): void {
    this.cargando = true;
    this.patrocinadorService.getAll().subscribe({
      next: (lista) => {
        this.patrocinadores = lista;
        this.cargando = false;
      },
      error: () => {
        this.showToast('error', 'Error al cargar patrocinadores');
        this.cargando = false;
      }
    });
  }

  abrirFormPatrocinador(p?: Patrocinador): void {
    this.editandoPatrocinador = !!p;
    this.patrocinadorSeleccionado = p ?? null;
    this.formularioPatrocinador = {
      nombre:      p?.nombre      ?? '',
      logoUrl:     p?.logoUrl     ?? '',
      sitioWeb:    p?.sitioWeb    ?? '',
      descripcion: p?.descripcion ?? '',
      contacto:    p?.contacto    ?? ''
    };
    this.mostrandoFormPatrocinador = true;
  }

  cerrarFormPatrocinador(): void {
    this.mostrandoFormPatrocinador = false;
    this.patrocinadorSeleccionado = null;
    this.editandoPatrocinador = false;
  }

  guardarPatrocinador(): void {
    if (!this.formularioPatrocinador.nombre.trim()) {
      this.showToast('error', 'El nombre del patrocinador es requerido');
      return;
    }

    this.cargando = true;
    const datos: Partial<Patrocinador> = {
      nombre:      this.formularioPatrocinador.nombre.trim(),
      logoUrl:     this.formularioPatrocinador.logoUrl    || undefined,
      sitioWeb:    this.formularioPatrocinador.sitioWeb   || undefined,
      descripcion: this.formularioPatrocinador.descripcion || undefined,
      contacto:    this.formularioPatrocinador.contacto   || undefined
    };

    const op = this.editandoPatrocinador
      ? this.patrocinadorService.update(this.patrocinadorSeleccionado!.idPatrocinador!, datos)
      : this.patrocinadorService.create(datos);

    op.subscribe({
      next: () => {
        this.showToast('success', this.editandoPatrocinador ? 'Patrocinador actualizado' : 'Patrocinador creado');
        this.cerrarFormPatrocinador();
        this.cargarPatrocinadores();
      },
      error: (err) => {
        this.showToast('error', err.error?.mensaje || 'Error al guardar patrocinador');
        this.cargando = false;
      }
    });
  }

  confirmarEliminarPatrocinador(p: Patrocinador): void {
    this.mostrarModalConfirmacion({
      titulo: 'Eliminar patrocinador',
      mensaje: `¿Estás seguro de eliminar a "${p.nombre}"?`,
      mensajeSecundario: 'Esta acción no se puede deshacer',
      textoConfirmar: 'Eliminar',
      tipoBoton: 'danger',
      icono: 'ph-trash',
      iconoBoton: 'ph-trash',
      tipoAdvertencia: true,
      accion: () => this.eliminarPatrocinador(p.idPatrocinador!)
    });
  }

  eliminarPatrocinador(id: number): void {
    this.patrocinadorService.delete(id).subscribe({
      next: () => {
        this.showToast('success', 'Patrocinador eliminado');
        this.cargarPatrocinadores();
      },
      error: (err) => {
        this.showToast('error', err.error?.mensaje || 'No se pudo eliminar el patrocinador');
      }
    });
  }

  toggleActivoPatrocinador(p: Patrocinador): void {
    this.patrocinadorService.toggleActivo(p.idPatrocinador!).subscribe({
      next: (updated) => {
        const idx = this.patrocinadores.findIndex(x => x.idPatrocinador === p.idPatrocinador);
        if (idx !== -1) this.patrocinadores[idx] = updated;
        this.showToast('success', `Patrocinador ${updated.activo ? 'activado' : 'desactivado'}`);
      },
      error: () => this.showToast('error', 'Error al cambiar estado del patrocinador')
    });
  }

  // ---------- Torneos asignados a adminTorneo --------------------------------------------------------------------------------------------------------------------------------------------
  verTorneosAsignados(usuario: UsuarioExtendido): void {
    if (usuario.rol !== 'adminTorneo') return;
    this.usuarioConTorneos = usuario;
    this.mostrandoPanelTorneos = true;
    this.cargandoTorneos = true;
    this.torneosAsignados = [];

    this.usuarioService.getTorneosAsignados(usuario.idUsuario!).subscribe({
      next: (torneos) => {
        this.torneosAsignados = torneos;
        this.cargandoTorneos = false;
        if (!this.todosLosTorneos.length) this.cargarTodosLosTorneos();
      },
      error: () => {
        this.showToast('error', 'Error al cargar torneos asignados');
        this.cargandoTorneos = false;
      }
    });
  }

  cerrarPanelTorneos(): void {
    this.mostrandoPanelTorneos = false;
    this.usuarioConTorneos = null;
    this.torneosAsignados = [];
  }

  cargarTodosLosTorneos(): void {
    this.torneoService.getAll().subscribe({
      next: (res: any) => {
        this.todosLosTorneos = Array.isArray(res) ? res : (res.data ?? res.items ?? []);
      },
      error: () => {}
    });
  }

  torneoYaAsignado(idTorneo: number): boolean {
    return this.torneosAsignados.some((t: any) => t.idTorneo === idTorneo);
  }

  asignarTorneo(idTorneo: number): void {
    if (!this.usuarioConTorneos) return;
    this.torneoService.assignAdmin(idTorneo, this.usuarioConTorneos.idUsuario!).subscribe({
      next: () => {
        this.showToast('success', 'Torneo asignado correctamente');
        this.verTorneosAsignados(this.usuarioConTorneos!);
      },
      error: (err) => this.showToast('error', err.error?.mensaje || 'Error al asignar torneo')
    });
  }

  quitarTorneo(idTorneo: number): void {
    if (!this.usuarioConTorneos) return;
    this.torneoService.removeAdmin(idTorneo, this.usuarioConTorneos.idUsuario!).subscribe({
      next: () => {
        this.showToast('success', 'Torneo quitado correctamente');
        this.verTorneosAsignados(this.usuarioConTorneos!);
      },
      error: (err) => this.showToast('error', err.error?.mensaje || 'Error al quitar torneo')
    });
  }

  // ---------- Utilidades -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

  paginasHistorial: number[] = [];
  primeraVisible_H = false;
  ultimaVisible_H = false;
  haySeparadorIzq_H = false;
  haySeparadorDer_H = false;

  private actualizarPaginacionHistorial(): void {
    this.paginasHistorial = this.ventanaPaginas(this.paginaHistorial, this.totalPaginasHistorial);
    this.primeraVisible_H = this.paginasHistorial[0] > 1;
    this.ultimaVisible_H = this.paginasHistorial[this.paginasHistorial.length - 1] < this.totalPaginasHistorial;
    this.haySeparadorIzq_H = this.paginasHistorial[0] > 2;
    this.haySeparadorDer_H = this.paginasHistorial[this.paginasHistorial.length - 1] < this.totalPaginasHistorial - 1;
  }
}
