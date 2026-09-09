import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { TorneoContextService } from '../../../../services/torneo-context';
import { InscripcionService } from '../../../../services/inscripcion';
import { Torneo } from '../../../../models/torneo';
import { Inscripcion } from '../../../../models/inscripcion';
import { ModalEdicionInscripcionComponent } from '../../../../componentes/modales/edicion-inscripcion/edicion-inscripcion';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';

import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { BadgeComponent, BadgeStatus } from '../../../../componentes/atoms/badge/badge';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { SearchBarComponent } from '../../../../componentes/molecules/search-bar/search-bar';
import { FilterChipsComponent, FilterChipOption } from '../../../../componentes/molecules/filter-chips/filter-chips';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { DataTableComponent, DataTableColumn, SortDirection } from '../../../../componentes/organisms/data-table/data-table';
import { AvisoTorneoSeleccionadoComponent } from '../../../../componentes/molecules/aviso-torneo-seleccionado/aviso-torneo-seleccionado';


interface EstadisticasCategoria {
  idCategoria: number;
  nombreCategoria: string;
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  promedioRating: number;
  ratingMasAlto: number;
  ratingMasBajo: number;
  inscripciones: Inscripcion[];
}

interface EstadisticasGenerales {
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  porcentajePagos: number;
  promedioEdad: number;
  promedioRating: number;
}

@Component({
  selector: 'app-inscripciones-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ModalEdicionInscripcionComponent, ToastNoti, ModalConfirmacionComponent,
    PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent, IconComponent, IconButtonComponent,
    BadgeComponent, SelectComponent, SearchBarComponent, FilterChipsComponent, StatCardGridComponent,
    DataTableComponent, AvisoTorneoSeleccionadoComponent
  ],
  templateUrl: './inscripciones-torneo.html',
  styleUrls: ['./inscripciones-torneo.css']
})
export class InscripcionesAdminComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  readonly columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre Completo', icon: 'user', sortable: true },
    { key: 'telefono', label: 'Teléfono', icon: 'hash' },
    { key: 'categoria', label: 'Categoría', icon: 'stack' },
    { key: 'estadoJugador', label: 'Estado Jugador', icon: 'user', align: 'center' },
    { key: 'estadoPago', label: 'Estado Pago', icon: 'currency-dollar', align: 'center' },
    { key: 'estadoInscripcion', label: 'Estado Inscripción', icon: 'check-circle', align: 'center' },
    { key: 'acciones', label: 'Acciones', icon: 'gear', align: 'center' }
  ];

  readonly estadoPagoOptions: SelectOption<string>[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'parcial', label: 'Pago parcial' },
    { value: 'excedente', label: 'Excedente' },
    { value: 'pendiente', label: 'Pendientes' }
  ];

  readonly estadoInscripcionOptions: SelectOption<string>[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'cancelado', label: 'Cancelados' }
  ];

  torneoSeleccionado: Torneo | null = null;
  // Solo para saber si mostrar el aviso "cambia de torneo en Torneo Actual"
  // (no tiene sentido si el admin únicamente tiene uno asignado).
  totalTorneosAsignados = 0;
  categoriaSeleccionada: number | null = null;

  estadisticasGenerales: EstadisticasGenerales | null = null;
  estadisticasPorCategoria: EstadisticasCategoria[] = [];
  categorias: any[] = [];

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  filtroNombre = '';
  filtroEstadoPago: string = 'todos';
  filtroEstadoInscripcion: string = 'todos';

  columnaOrden: string = 'fecha_inscripcion';
  direccionOrden: 'ASC' | 'DESC' = 'DESC';

  modalDetallesVisible = false;
  inscripcionSeleccionada: Inscripcion | null = null;

  modalEdicionVisible = false;

  // Modal de confirmación de pago
  mostrarModalConfirmacion = false;
  inscripcionParaConfirmar: Inscripcion | null = null;

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 15;
  Math = Math;

  // Modal de confirmación de eliminación
  mostrarModalEliminacion = false;
  inscripcionParaEliminar: Inscripcion | null = null;

  // Derivados precalculados (NUNCA getters/métodos que devuelvan arrays nuevos en el
  // template — Angular los reevalúa en cada ciclo de detección de cambios y con
  // *ngFor sin trackBy eso causa NG0103 "infinite change detection").
  statCards: StatCardInput[] = [];
  categoriaFilterOptions: FilterChipOption[] = [];
  categoriaFilterActive = 'todas';
  inscripcionesFiltradas: Inscripcion[] = [];
  inscripcionesPaginadas: Inscripcion[] = [];
  totalPaginas = 0;
  paginasVisibles: number[] = [];

  constructor(
    private torneoService: TorneoService,
    private inscripcionService: InscripcionService,
    private authService: AuthService,
    private torneoContext: TorneoContextService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTorneoActual();
  }

  cargarTorneoActual(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    // adminTorneo: la asignación ya acota server-side, no hay que filtrar
    // además por activo (un torneo asignado pero finalizado/inactivo sigue
    // siendo válido para consultar sus inscripciones).
    const esAdminTorneo = this.authService.currentUserValue?.rol === 'adminTorneo';
    this.torneoService.getAll(esAdminTorneo ? undefined : true).subscribe({
      next: (torneos) => {
        this.totalTorneosAsignados = torneos?.length || 0;
        if (torneos && torneos.length > 0) {
          const torneosOrdenados = this.torneoContext.prepararCandidatos(torneos);

          // Respetar el torneo elegido en el contexto compartido (p.ej. desde
          // "Torneo Actual" u otra vista hermana) si sigue entre los propios.
          const seleccionActual = this.torneoContext.torneoSeleccionadoValue;
          const seleccionVigente = seleccionActual
            ? torneosOrdenados.find(t => t.idTorneo === seleccionActual.idTorneo)
            : undefined;

          this.torneoSeleccionado = seleccionVigente || this.torneoContext.elegirPorDefecto(torneosOrdenados) || null;

          this.torneoContext.seleccionar(this.torneoSeleccionado);

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.sinDatos = 'No hay torneos activos';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar el torneo actual';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarInscripciones(idTorneo: number): void {
    this.inscripcionService.getByTorneo(idTorneo).subscribe({
      next: (inscripciones) => {
        this.procesarEstadisticas(inscripciones);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar inscripciones';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  procesarEstadisticas(inscripciones: Inscripcion[]): void {

    const categorias = new Map<number, EstadisticasCategoria>();

    inscripciones.forEach(insc => {
      const idCat = insc.idCategoria || 0;

      if (!categorias.has(idCat)) {
        categorias.set(idCat, {
          idCategoria: idCat,
          nombreCategoria: insc.categoria?.nombre || 'Sin categoría',
          totalInscritos: 0,
          pagosConfirmados: 0,
          pagosPendientes: 0,
          totalRecaudado: 0,
          promedioRating: 0,
          ratingMasAlto: 0,
          ratingMasBajo: 9999,
          inscripciones: []
        });
      }

      const cat = categorias.get(idCat)!;
      // La tabla detallada sí debe seguir mostrando las canceladas —
      // solo se excluyen de los conteos/promedios de abajo.
      cat.inscripciones.push(insc);

      if (insc.estado === 'cancelado') return;

      const montoPagadoNum = Number(insc.montoPagado) || 0;
      const costoCategoria = Number(insc.categoria?.costo) || 0;
      const pagoCompleto = montoPagadoNum >= costoCategoria && costoCategoria > 0;

      cat.totalInscritos++;

      if (pagoCompleto) {
        cat.pagosConfirmados++;
      } else {
        cat.pagosPendientes++;
      }

      cat.totalRecaudado += montoPagadoNum;

      const rating = insc.jugador?.rating || 0;
      if (rating > 0) {
        cat.ratingMasAlto = Math.max(cat.ratingMasAlto, rating);
        cat.ratingMasBajo = Math.min(cat.ratingMasBajo, rating);
      }
    });

    categorias.forEach(cat => {
      const ratings = cat.inscripciones
        .filter(i => i.estado !== 'cancelado')
        .map(i => i.jugador?.rating || 0)
        .filter(r => r > 0);

      cat.promedioRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      if (cat.ratingMasBajo === 9999) cat.ratingMasBajo = 0;
    });

    this.estadisticasPorCategoria = Array.from(categorias.values());
    this.cargarCategorias();

    // Igual que arriba: una inscripción cancelada no cuenta como "inscrito"
    // en ninguno de los totales generales, aunque siga visible en la tabla.
    const inscripcionesActivas = inscripciones.filter(i => i.estado !== 'cancelado');
    const totalInscritos = inscripcionesActivas.length;

    const pagosConfirmados = inscripcionesActivas.filter(i => {
      const montoPagado = Number(i.montoPagado) || 0;
      const costo = Number(i.categoria?.costo) || 0;
      return montoPagado >= costo && costo > 0;
    }).length;

    const totalRecaudado = inscripcionesActivas.reduce((sum, i) => {
      return sum + (Number(i.montoPagado) || 0);
    }, 0);

    const edades = inscripcionesActivas
      .map(i => i.edad || 0)
      .filter(e => e > 0);

    const ratings = inscripcionesActivas
      .map(i => i.jugador?.rating || 0)
      .filter(r => r > 0);

    this.estadisticasGenerales = {
      totalInscritos,
      pagosConfirmados,
      pagosPendientes: totalInscritos - pagosConfirmados,
      totalRecaudado,
      porcentajePagos: totalInscritos > 0 ? (pagosConfirmados / totalInscritos) * 100 : 0,
      promedioEdad: edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0,
      promedioRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    };

    this.actualizarDerivados();
  }

  /**
   * Todas las categorías asignadas al torneo (no solo las que ya tienen
   * inscripciones) — el modal de edición debe poder mover a un jugador a
   * cualquier categoría del torneo, incluso una sin inscritos todavía.
   */
  cargarCategorias(): void {
    const torneoCategorias = this.torneoSeleccionado?.torneoCategorias || [];
    this.categorias = torneoCategorias
      .filter(tc => tc.categoria)
      .map(tc => ({
        idCategoria: tc.idCategoria,
        nombre: tc.categoria!.nombre,
        costo: tc.categoria!.costo
      }));
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionada = idCategoria;
    this.paginaActual = 1;
    this.categoriaFilterActive = this.categoriaSeleccionada === null ? 'todas' : String(this.categoriaSeleccionada);
    this.actualizarListaYPaginacion();
  }

  private actualizarDerivados(): void {
    this.statCards = !this.estadisticasGenerales ? [] : [
      { icon: 'users', variant: 'info', label: 'Total Inscritos', value: this.estadisticasGenerales.totalInscritos },
      { icon: 'check-circle', variant: 'success', label: 'Pagos Confirmados', value: this.estadisticasGenerales.pagosConfirmados, sub: `${(this.estadisticasGenerales.porcentajePagos).toFixed(0)}%` },
      { icon: 'clock', variant: 'warning', label: 'Pagos Pendientes', value: this.estadisticasGenerales.pagosPendientes },
      { icon: 'currency-dollar', variant: 'brown', label: 'Total Recaudado', value: `$${this.estadisticasGenerales.totalRecaudado.toFixed(2)}` },
      { icon: 'chart-line', variant: 'purple', label: 'Rating Promedio', value: Math.round(this.estadisticasGenerales.promedioRating) },
      { icon: 'calendar', variant: 'teal', label: 'Edad Promedio', value: `${Math.round(this.estadisticasGenerales.promedioEdad)} años` }
    ];

    this.categoriaFilterOptions = [
      { value: 'todas', label: 'Todas las Categorías', icon: 'stack' },
      ...this.estadisticasPorCategoria.map(cat => ({
        value: String(cat.idCategoria),
        label: cat.nombreCategoria,
        icon: 'grid-four',
        count: cat.totalInscritos
      }))
    ];

    this.categoriaFilterActive = this.categoriaSeleccionada === null ? 'todas' : String(this.categoriaSeleccionada);

    this.actualizarListaYPaginacion();
  }

  onCategoriaFilterChange(value: string): void {
    this.seleccionarCategoria(value === 'todas' ? null : Number(value));
  }

  onFiltroNombreChange(valor: string): void {
    this.filtroNombre = valor;
    this.actualizarListaYPaginacion();
  }

  onFiltroEstadoPagoChange(valor: string): void {
    this.filtroEstadoPago = valor;
    this.actualizarListaYPaginacion();
  }

  onFiltroEstadoInscripcionChange(valor: string): void {
    this.filtroEstadoInscripcion = valor;
    this.actualizarListaYPaginacion();
  }

  onSortChange(event: { key: string; dir: SortDirection }): void {
    this.columnaOrden = event.key;
    this.direccionOrden = event.dir;
    this.actualizarListaYPaginacion();
  }

  getBadgeStatusPago(inscripcion: Inscripcion): BadgeStatus {
    const estado = this.getEstadoPago(inscripcion);
    switch (estado) {
      case 'confirmado': return 'confirmed';
      case 'parcial': return 'partial';
      case 'excedente': return 'excess';
      default: return 'pending';
    }
  }

  getBadgeStatusInscripcion(estado: string | undefined): BadgeStatus {
    switch (estado) {
      case 'confirmado': return 'confirmed';
      case 'cancelado': return 'cancelled';
      case 'pendiente':
      default: return 'pending';
    }
  }

  private calcularInscripcionesFiltradas(): Inscripcion[] {
    let inscripciones: Inscripcion[] = [];

    if (this.categoriaSeleccionada === null) {
      inscripciones = this.estadisticasPorCategoria.flatMap(c => c.inscripciones);
    } else {
      const cat = this.estadisticasPorCategoria.find(c => c.idCategoria === this.categoriaSeleccionada);
      inscripciones = cat?.inscripciones || [];
    }

    if (this.filtroNombre) {
      const filtro = this.filtroNombre.toLowerCase();
      inscripciones = inscripciones.filter(i => {
        const nombreCompleto = `${i.jugador?.nombre || ''} ${i.jugador?.apellido1 || ''} ${i.jugador?.apellido2 || ''}`.toLowerCase();
        return nombreCompleto.includes(filtro);
      });
    }

    if (this.filtroEstadoPago !== 'todos') {
      // Reutiliza getEstadoPago() en vez de repetir la comparación
      // monto/costo aquí — ya incluye el caso "excedente".
      inscripciones = inscripciones.filter(i => this.getEstadoPago(i) === this.filtroEstadoPago);
    }

    if (this.filtroEstadoInscripcion !== 'todos') {
      inscripciones = inscripciones.filter(i => i.estado === this.filtroEstadoInscripcion);
    }

    inscripciones.sort((a, b) => {
      let valorA: any, valorB: any;

      switch (this.columnaOrden) {
        case 'nombre':
          valorA = `${a.jugador?.nombre || ''} ${a.jugador?.apellido1 || ''}`;
          valorB = `${b.jugador?.nombre || ''} ${b.jugador?.apellido1 || ''}`;
          break;
        case 'rating':
          valorA = a.jugador?.rating || 0;
          valorB = b.jugador?.rating || 0;
          break;
        case 'edad':
          valorA = a.edad || 0;
          valorB = b.edad || 0;
          break;
        case 'monto':
          valorA = a.montoPagado || 0;
          valorB = b.montoPagado || 0;
          break;
        case 'fecha_inscripcion':
        default:
          valorA = new Date(a.fechaInscripcion || 0).getTime();
          valorB = new Date(b.fechaInscripcion || 0).getTime();
      }

      if (this.direccionOrden === 'ASC') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

    return inscripciones;
  }

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'ASC';
    }
    this.actualizarListaYPaginacion();
  }

  confirmarPago(inscripcion: Inscripcion): void {
    if (!inscripcion.idInscripcion) return;

    const monto = inscripcion.categoria?.costo || 0;

    if (monto <= 0) {
      this.toast.error('Error', 'La categoria no tiene un costo definido');
      return;
    }

    // Guardar la inscripción y mostrar el modal
    this.inscripcionParaConfirmar = inscripcion;
    this.mostrarModalConfirmacion = true;
  }

  onConfirmarPago(): void {
    if (!this.inscripcionParaConfirmar?.idInscripcion) return;

    const monto = this.inscripcionParaConfirmar.categoria?.costo || 0;

    const datosActualizacion = {
      pago_confirmado: true,
      monto_pagado: Number(monto),
      estado: 'confirmado'
    };

    this.inscripcionService.update(this.inscripcionParaConfirmar.idInscripcion, datosActualizacion).subscribe({
      next: (response) => {
        this.toast.success('Jugador confirmado', 'Pago e inscripción confirmados exitosamente');
        this.mostrarModalConfirmacion = false;
        this.inscripcionParaConfirmar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al confirmar el pago:', err);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al confirmar el pago';
        this.toast.error('Error', mensaje);
        this.mostrarModalConfirmacion = false;
        this.inscripcionParaConfirmar = null;
      }
    });
  }

  onCancelarConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.inscripcionParaConfirmar = null;
  }

  getMensajeConfirmacion(): string {
    if (!this.inscripcionParaConfirmar) return '';

    const nombreCompleto = `${this.inscripcionParaConfirmar.jugador?.nombre} ${this.inscripcionParaConfirmar.jugador?.apellido1}`;
    // costo llega como Decimal de Prisma (string en el JSON), no number — sin
    // el Number() explícito, .toFixed() truena con "monto.toFixed is not a function".
    const monto = Number(this.inscripcionParaConfirmar.categoria?.costo) || 0;

    return `Se confirmará el pago de <strong>$${monto.toFixed(2)}</strong> para el jugador <strong>${nombreCompleto}</strong>`;
  }

  getMensajeSecundarioConfirmacion(): string {
    const montoPagado = Number(this.inscripcionParaConfirmar?.montoPagado) || 0;
    const costoCategoria = Number(this.inscripcionParaConfirmar?.categoria?.costo) || 0;

    if (montoPagado > 0 && montoPagado < costoCategoria) {
      return `El jugador ya tiene un pago parcial de $${montoPagado.toFixed(2)}. Esta acción completará el pago total.`;
    }

    return 'Esta acción actualizará el estado de la inscripción a confirmado.';
  }

  confirmarPagoModal(): void {
    if (this.inscripcionSeleccionada && !this.inscripcionSeleccionada.pagoConfirmado) {
      this.confirmarPago(this.inscripcionSeleccionada);
      this.cerrarModal();
    }
  }

  getMontoPagado(inscripcion: Inscripcion): number {
    const montoPagado = Number(inscripcion.montoPagado) || 0;
    return montoPagado;
  }

  puedePagarInscripcion(inscripcion: Inscripcion): boolean {
    const estadoPago = this.getEstadoPago(inscripcion);
    const costoCategoria = inscripcion.categoria?.costo || 0;
    const puedePagar = estadoPago !== 'confirmado' && costoCategoria > 0;
    return puedePagar;
  }

  actualizarEstadisticas(): void {
    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
    }
  }

  getEstadoPago(inscripcion: Inscripcion): 'confirmado' | 'parcial' | 'pendiente' | 'excedente' {
    const montoPagado = Number(inscripcion.montoPagado) || 0;
    const costoCategoria = Number(inscripcion.categoria?.costo) || 0;
    const pagoConfirmado = Boolean(inscripcion.pagoConfirmado);

    // Típicamente por un cambio a una categoría más barata después de ya
    // haber pagado el costo de la anterior — se revisa antes que "confirmado"
    // porque el admin necesita verlo aunque el pago también esté marcado
    // como confirmado.
    if (costoCategoria > 0 && montoPagado > costoCategoria) {
      return 'excedente';
    }

    if (pagoConfirmado && montoPagado >= costoCategoria) {
      return 'confirmado';
    }

    if (montoPagado > 0 && montoPagado < costoCategoria) {
      return 'parcial';
    }

    return 'pendiente';
  }

  getEstadoPagoClase(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'status-confirmed';
      case 'parcial':
        return 'status-partial';
      case 'excedente':
        return 'status-excess';
      case 'pendiente':
      default:
        return 'status-pending';
    }
  }

  getEstadoPagoTexto(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'Confirmado';
      case 'parcial':
        return 'Pago Parcial';
      case 'excedente': {
        const excedente = (Number(inscripcion.montoPagado) || 0) - (Number(inscripcion.categoria?.costo) || 0);
        return `Excedente ($${excedente.toFixed(2)})`;
      }
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  getEstadoPagoIcono(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'fa-circle-check';
      case 'parcial':
        return 'fa-circle-half-stroke';
      case 'excedente':
        return 'fa-circle-exclamation';
      case 'pendiente':
      default:
        return 'fa-clock';
    }
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearFechaCompleta(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return '-';

    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (telefonoLimpio.length === 10) {
      return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    return telefono;
  }

  getEstadoClase(estado: string | undefined): string {
    switch (estado) {
      case 'confirmado': return 'status-confirmed';
      case 'pendiente': return 'status-pending';
      case 'cancelado': return 'status-cancelled';
      default: return '';
    }
  }

  getPorcentajePagosPorCategoria(cat: EstadisticasCategoria): number {
    return cat.totalInscritos > 0
      ? (cat.pagosConfirmados / cat.totalInscritos) * 100
      : 0;
  }

  exportarDatos(): void {
    const inscripciones = this.inscripcionesFiltradas;
    const csv = this.generarCSV(inscripciones);
    this.descargarCSV(csv, `inscripciones_${this.torneoSeleccionado?.nombre || 'torneo'}.csv`);
  }

  private generarCSV(inscripciones: Inscripcion[]): string {
    const headers = ['Nombre', 'Apellido1', 'Apellido2', 'Teléfono', 'Edad', 'Rating', 'Categoría', 'Estado Pago', 'Monto', 'Estado Inscripción', 'Fecha'];

    const rows = inscripciones.map(i => [
      i.jugador?.nombre || '',
      i.jugador?.apellido1 || '',
      i.jugador?.apellido2 || '',
      i.jugador?.telefono || '',
      i.edad || '',
      i.jugador?.rating || '',
      i.categoria?.nombre || '',
      i.pagoConfirmado ? 'Confirmado' : 'Pendiente',
      i.montoPagado || 0,
      i.estado || '',
      this.formatearFecha(i.fechaInscripcion)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private descargarCSV(contenido: string, nombreArchivo: string): void {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  verDetalles(inscripcion: Inscripcion): void {
    this.inscripcionSeleccionada = inscripcion;
    this.modalDetallesVisible = true;
  }

  cerrarModal(): void {
    this.modalDetallesVisible = false;
    this.inscripcionSeleccionada = null;
  }

  editarInscripcion(inscripcion: Inscripcion): void {
    this.inscripcionSeleccionada = inscripcion;
    this.modalEdicionVisible = true;
  }

  editarInscripcionModal(): void {
    if (this.inscripcionSeleccionada) {
      this.cerrarModal();
      this.modalEdicionVisible = true;
    }
  }

  cerrarModalEdicion(): void {
    this.modalEdicionVisible = false;
    this.inscripcionSeleccionada = null;
  }

  onModalEdicionActualizado(): void {
    this.cerrarModalEdicion();
    this.actualizarEstadisticas();
    // El toast del modal de edición se destruye junto con el modal antes de
    // poder mostrarse (su <app-toast-noti> vive dentro del *ngIf que lo
    // oculta) — se notifica aquí, en la vista contenedora, que sí persiste.
    this.toast.success('Cambios guardados', 'Los datos del jugador y de la inscripción se actualizaron correctamente');
  }

  eliminarInscripcion(inscripcion: Inscripcion): void {
    if (!inscripcion.idInscripcion) return;

    // Guardar la inscripción y mostrar el modal
    this.inscripcionParaEliminar = inscripcion;
    this.mostrarModalEliminacion = true;
  }

  eliminarInscripcionModal(): void {
    if (this.inscripcionSeleccionada) {
      this.cerrarModal();
      this.eliminarInscripcion(this.inscripcionSeleccionada);
    }
  }

  onConfirmarEliminacion(): void {
    if (!this.inscripcionParaEliminar?.idInscripcion) return;

    this.inscripcionService.delete(this.inscripcionParaEliminar.idInscripcion).subscribe({
      next: () => {
        this.toast.success('Inscripción eliminada', 'La inscripción se eliminó exitosamente');
        this.mostrarModalEliminacion = false;
        this.inscripcionParaEliminar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al eliminar la inscripción:', err);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al eliminar la inscripción';
        this.toast.error('Error', mensaje);
        this.mostrarModalEliminacion = false;
        this.inscripcionParaEliminar = null;
      }
    });
  }

  onCancelarEliminacion(): void {
    this.mostrarModalEliminacion = false;
    this.inscripcionParaEliminar = null;
  }

  getMensajeEliminacion(): string {
    if (!this.inscripcionParaEliminar) return '';

    const nombreCompleto = `${this.inscripcionParaEliminar.jugador?.nombre} ${this.inscripcionParaEliminar.jugador?.apellido1}`;

    return `¿Estás seguro de eliminar la inscripción de <strong>${nombreCompleto}</strong>?`;
  }

  getMensajeSecundarioEliminacion(): string {
    return 'Esta acción no se puede deshacer. Toda la información relacionada con esta inscripción será eliminada permanentemente.';
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarListaYPaginacion();
    }
  }

  private actualizarListaYPaginacion(): void {
    this.inscripcionesFiltradas = this.calcularInscripcionesFiltradas();

    this.totalPaginas = Math.ceil(this.inscripcionesFiltradas.length / this.registrosPorPagina);

    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.inscripcionesPaginadas = this.inscripcionesFiltradas.slice(inicio, fin);

    this.paginasVisibles = this.calcularPaginasVisibles();
  }

  private calcularPaginasVisibles(): number[] {
    const totalPaginas = this.totalPaginas;
    const paginaActual = this.paginaActual;

    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const paginas: number[] = [1];

    if (paginaActual > 3) {
      paginas.push(-1);
    }

    const inicio = Math.max(2, paginaActual - 1);
    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    if (paginaActual < totalPaginas - 2) {
      paginas.push(-1);
    }

    paginas.push(totalPaginas);

    return paginas;
  }
}
