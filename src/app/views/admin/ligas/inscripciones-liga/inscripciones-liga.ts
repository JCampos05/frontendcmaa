import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InfoLigaService } from '../../../../services/info-liga';
import { JugadorLigaService } from '../../../../services/jugador-liga';
import { GrupoLigaService } from '../../../../services/grupo-liga';
import { InfoLiga } from '../../../../models/infoLiga';
import { JugadorLiga } from '../../../../models/jugadorLiga';
import { GrupoLiga } from '../../../../models/grupoLiga';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { FilterChipsComponent, FilterChipOption } from '../../../../componentes/molecules/filter-chips/filter-chips';
import { DataTableComponent, DataTableColumn, SortDirection } from '../../../../componentes/organisms/data-table/data-table';
import { BadgeComponent, BadgeStatus } from '../../../../componentes/atoms/badge/badge';
import { SearchBarComponent } from '../../../../componentes/molecules/search-bar/search-bar';

interface EstadisticasGrupo {
  idGrupo: number;
  nombreGrupo: string;
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  promedioRating: number;
  ratingMasAlto: number;
  ratingMasBajo: number;
  inscripciones: JugadorLiga[];
}

interface EstadisticasGenerales {
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  porcentajePagos: number;
  promedioRating: number;
  totalGrupos: number;
}

@Component({
  selector: 'app-inscripciones-liga',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToastNoti, ModalConfirmacionComponent,
    PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent, IconComponent, IconButtonComponent,
    SelectComponent, StatCardGridComponent, FilterChipsComponent, DataTableComponent, BadgeComponent, SearchBarComponent
  ],
  templateUrl: './inscripciones-liga.html',
  styleUrls: ['./inscripciones-liga.css']
})
export class InscripcionesLigaComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  ligaSeleccionada: InfoLiga | null = null;
  ligasActivas: InfoLiga[] = [];
  grupoSeleccionado: number | null = null;

  estadisticasGenerales: EstadisticasGenerales | null = null;
  estadisticasPorGrupo: EstadisticasGrupo[] = [];
  grupos: GrupoLiga[] = [];

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  filtroNombre = '';
  filtroEstadoPago: string = 'todos';
  filtroEstadoInscripcion: string = 'todos';
  filtroGrupo: number | null = null;

  columnaOrden: string = 'fecha_inscripcion';
  direccionOrden: 'ASC' | 'DESC' = 'DESC';

  modalDetallesVisible = false;
  inscripcionSeleccionada: JugadorLiga | null = null;

  mostrarModalConfirmacion = false;
  inscripcionParaConfirmar: JugadorLiga | null = null;

  paginaActual = 1;
  registrosPorPagina = 15;
  Math = Math;

  mostrarModalEliminacion = false;
  inscripcionParaEliminar: JugadorLiga | null = null;

  readonly columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre Completo', icon: 'user', sortable: true },
    { key: 'telefono', label: 'Teléfono', icon: 'phone' },
    { key: 'grupo', label: 'Grupo', icon: 'users' },
    { key: 'estadoPago', label: 'Estado Pago', icon: 'credit-card', align: 'center' },
    { key: 'estadoInscripcion', label: 'Estado Inscripción', icon: 'check-circle', align: 'center' },
    { key: 'acciones', label: 'Acciones', icon: 'gear', align: 'center' }
  ];

  readonly estadoPagoOptions: SelectOption<string>[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'pendiente', label: 'Pendientes' }
  ];

  readonly estadoInscripcionOptions: SelectOption<string>[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'inscrito', label: 'Inscritos' },
    { value: 'retirado', label: 'Retirados' },
    { value: 'cancelado', label: 'Cancelados' }
  ];

  // Derivados precalculados (NUNCA getters/métodos que devuelvan arrays nuevos en el
  // template — Angular los reevalúa en cada ciclo de detección de cambios y con
  // *ngFor sin trackBy eso causa NG0103 "infinite change detection").
  ligaOptions: SelectOption<InfoLiga>[] = [];
  statCards: StatCardInput[] = [];
  grupoFilterOptions: FilterChipOption[] = [];
  grupoFilterActive = 'todos';
  grupoFiltroOptions: SelectOption<number | null>[] = [];
  inscripcionesFiltradas: JugadorLiga[] = [];
  inscripcionesPaginadas: JugadorLiga[] = [];
  totalPaginas = 0;
  paginasVisibles: number[] = [];

  constructor(
    private infoLigaService: InfoLigaService,
    private jugadorLigaService: JugadorLigaService,
    private grupoLigaService: GrupoLigaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarLigaActual();
  }

  cargarLigaActual(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    this.infoLigaService.getAll({ activo: 1 }).subscribe({
      next: (ligas) => {
        if (ligas && ligas.length > 0) {
          this.ligasActivas = ligas.sort((a, b) => {
            return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
          });
          this.actualizarDerivados();

          this.ligaSeleccionada = this.ligasActivas[0];

          if (this.ligaSeleccionada?.idLiga) {
            this.cargarInscripciones(this.ligaSeleccionada.idLiga);
          }
        } else {
          this.sinDatos = 'No hay ligas activas';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar las ligas activas';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onLigaChange(): void {
    if (this.ligaSeleccionada?.idLiga) {
      this.grupoSeleccionado = null;
      this.paginaActual = 1;
      this.cargarInscripciones(this.ligaSeleccionada.idLiga);
    }
  }

  onLigaSeleccionadaChange(liga: InfoLiga): void {
    this.ligaSeleccionada = liga;
    this.onLigaChange();
  }

  onGrupoFilterChange(value: string): void {
    this.seleccionarGrupo(value === 'todos' ? null : Number(value));
  }

  onFiltroGrupoChange(value: number | null): void {
    this.filtroGrupo = value;
    this.actualizarListaYPaginacion();
  }

  private actualizarDerivados(): void {
    this.ligaOptions = this.ligasActivas.map(l => ({ value: l, label: `${l.nombre} - ${this.formatearFecha(l.fecha_inicio)}` }));

    this.statCards = !this.estadisticasGenerales ? [] : [
      { icon: 'users', variant: 'info', label: 'Total Inscritos', value: this.estadisticasGenerales.totalInscritos },
      { icon: 'check-circle', variant: 'success', label: 'Pagos Confirmados', value: this.estadisticasGenerales.pagosConfirmados, sub: `${Math.round(this.estadisticasGenerales.porcentajePagos)}%` },
      { icon: 'clock', variant: 'warning', label: 'Pagos Pendientes', value: this.estadisticasGenerales.pagosPendientes },
      { icon: 'credit-card', variant: 'brown', label: 'Total Recaudado', value: `$${this.estadisticasGenerales.totalRecaudado.toFixed(2)}` },
      { icon: 'chart-line', variant: 'purple', label: 'Rating Promedio', value: Math.round(this.estadisticasGenerales.promedioRating) },
      { icon: 'stack', variant: 'teal', label: 'Total Grupos', value: this.estadisticasGenerales.totalGrupos }
    ];

    this.grupoFilterOptions = [
      { value: 'todos', label: 'Todos los Grupos', icon: 'stack' },
      ...this.estadisticasPorGrupo.map(g => ({
        value: String(g.idGrupo),
        label: g.nombreGrupo,
        icon: 'users',
        count: g.totalInscritos
      }))
    ];

    this.grupoFilterActive = this.grupoSeleccionado === null ? 'todos' : String(this.grupoSeleccionado);

    this.grupoFiltroOptions = [
      { value: null, label: 'Todos los grupos' },
      ...this.estadisticasPorGrupo.map(g => ({ value: g.idGrupo, label: g.nombreGrupo }))
    ];

    this.actualizarListaYPaginacion();
  }

  cargarInscripciones(idLiga: number): void {
    this.jugadorLigaService.getByLiga(idLiga).subscribe({
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

  procesarEstadisticas(inscripciones: JugadorLiga[]): void {
    const grupos = new Map<number, EstadisticasGrupo>();

    inscripciones.forEach(insc => {
      const montoPagadoNum = Number(insc.monto_pagado) || 0;
      const costoLiga = Number(this.ligaSeleccionada?.costo_inscripcion) || 0;

      const pagoCompleto = montoPagadoNum >= costoLiga && costoLiga > 0;

      const idGrupo = insc.idGrupoLiga || 0;

      if (!grupos.has(idGrupo)) {
        grupos.set(idGrupo, {
          idGrupo: idGrupo,
          nombreGrupo: insc.grupo?.nombre || 'Sin grupo',
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

      const grupo = grupos.get(idGrupo)!;
      grupo.totalInscritos++;
      grupo.inscripciones.push(insc);

      if (pagoCompleto) {
        grupo.pagosConfirmados++;
      } else {
        grupo.pagosPendientes++;
      }

      grupo.totalRecaudado += montoPagadoNum;

      const rating = insc.rating_inicial || 0;
      if (rating > 0) {
        grupo.ratingMasAlto = Math.max(grupo.ratingMasAlto, rating);
        grupo.ratingMasBajo = Math.min(grupo.ratingMasBajo, rating);
      }
    });

    grupos.forEach(grupo => {
      const ratings = grupo.inscripciones
        .map(i => i.rating_inicial || 0)
        .filter(r => r > 0);

      grupo.promedioRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      if (grupo.ratingMasBajo === 9999) grupo.ratingMasBajo = 0;
    });

    this.estadisticasPorGrupo = Array.from(grupos.values());

    const totalInscritos = inscripciones.length;

    const pagosConfirmados = inscripciones.filter(i => {
      const montoPagado = Number(i.monto_pagado) || 0;
      const costo = Number(this.ligaSeleccionada?.costo_inscripcion) || 0;
      return montoPagado >= costo && costo > 0;
    }).length;

    const totalRecaudado = inscripciones.reduce((sum, i) => {
      return sum + (Number(i.monto_pagado) || 0);
    }, 0);

    const ratings = inscripciones
      .map(i => i.rating_inicial || 0)
      .filter(r => r > 0);

    this.estadisticasGenerales = {
      totalInscritos,
      pagosConfirmados,
      pagosPendientes: totalInscritos - pagosConfirmados,
      totalRecaudado,
      porcentajePagos: totalInscritos > 0 ? (pagosConfirmados / totalInscritos) * 100 : 0,
      promedioRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      totalGrupos: grupos.size
    };

    this.actualizarDerivados();
  }

  seleccionarGrupo(idGrupo: number | null): void {
    this.grupoSeleccionado = idGrupo;
    this.paginaActual = 1;
    this.grupoFilterActive = this.grupoSeleccionado === null ? 'todos' : String(this.grupoSeleccionado);
    this.actualizarListaYPaginacion();
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

  private calcularInscripcionesFiltradas(): JugadorLiga[] {
    let inscripciones: JugadorLiga[] = [];

    if (this.grupoSeleccionado === null) {
      inscripciones = this.estadisticasPorGrupo.flatMap(g => g.inscripciones);
    } else {
      const grupo = this.estadisticasPorGrupo.find(g => g.idGrupo === this.grupoSeleccionado);
      inscripciones = grupo?.inscripciones || [];
    }

    // Filtro por nombre
    if (this.filtroNombre) {
      const filtro = this.filtroNombre.toLowerCase();
      inscripciones = inscripciones.filter(i => {
        const nombreCompleto = `${i.jugador?.nombre || ''} ${i.jugador?.apellido1 || ''} ${i.jugador?.apellido2 || ''}`.toLowerCase();
        return nombreCompleto.includes(filtro);
      });
    }

    // NUEVO: Filtro por grupo
    if (this.filtroGrupo !== null) {
      inscripciones = inscripciones.filter(i => i.idGrupoLiga === this.filtroGrupo);
    }

    // Filtro por estado de pago
    if (this.filtroEstadoPago !== 'todos') {
      inscripciones = inscripciones.filter(i => {
        const montoPagado = Number(i.monto_pagado) || 0;
        const costoLiga = Number(this.ligaSeleccionada?.costo_inscripcion) || 0;

        if (this.filtroEstadoPago === 'confirmado') {
          return montoPagado >= costoLiga && costoLiga > 0;
        }
        if (this.filtroEstadoPago === 'parcial') {
          return montoPagado > 0 && montoPagado < costoLiga;
        }
        if (this.filtroEstadoPago === 'pendiente') {
          return montoPagado < costoLiga;
        }

        return true;
      });
    }

    // Filtro por estado de inscripción
    if (this.filtroEstadoInscripcion !== 'todos') {
      inscripciones = inscripciones.filter(i => i.estado === this.filtroEstadoInscripcion);
    }

    // Ordenamiento
    inscripciones.sort((a, b) => {
      let valorA: any, valorB: any;

      switch (this.columnaOrden) {
        case 'nombre':
          valorA = `${a.jugador?.nombre || ''} ${a.jugador?.apellido1 || ''}`;
          valorB = `${b.jugador?.nombre || ''} ${b.jugador?.apellido1 || ''}`;
          break;
        case 'rating':
          valorA = a.rating_inicial || 0;
          valorB = b.rating_inicial || 0;
          break;
        case 'monto':
          valorA = a.monto_pagado || 0;
          valorB = b.monto_pagado || 0;
          break;
        case 'fecha_inscripcion':
        default:
          valorA = new Date(a.fecha_inscripcion || 0).getTime();
          valorB = new Date(b.fecha_inscripcion || 0).getTime();
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

  onSortChange(event: { key: string; dir: SortDirection }): void {
    this.columnaOrden = event.key;
    this.direccionOrden = event.dir;
    this.actualizarListaYPaginacion();
  }

  confirmarPago(inscripcion: JugadorLiga): void {
    if (!inscripcion.idJugadorLiga) return;

    const monto = this.ligaSeleccionada?.costo_inscripcion || 0;

    if (monto <= 0) {
      this.toast.error('Error', 'La liga no tiene un costo definido');
      return;
    }

    this.inscripcionParaConfirmar = inscripcion;
    this.mostrarModalConfirmacion = true;
  }

  onConfirmarPago(): void {
    if (!this.inscripcionParaConfirmar?.idJugadorLiga) return;

    const monto = this.ligaSeleccionada?.costo_inscripcion || 0;

    this.jugadorLigaService.confirmarPago(this.inscripcionParaConfirmar.idJugadorLiga, monto).subscribe({
      next: () => {
        this.toast.success('Jugador confirmado', 'Pago e inscripción confirmados exitosamente');
        this.mostrarModalConfirmacion = false;
        this.inscripcionParaConfirmar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al confirmar el pago:', err);
        const mensaje = err?.error?.message || 'Error al confirmar el pago';
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
    const monto = this.ligaSeleccionada?.costo_inscripcion || 0;

    return `Se confirmará el pago de <strong>$${monto.toFixed(2)}</strong> para el jugador <strong>${nombreCompleto}</strong>`;
  }

  getMensajeSecundarioConfirmacion(): string {
    const montoPagado = Number(this.inscripcionParaConfirmar?.monto_pagado) || 0;
    const costoLiga = Number(this.ligaSeleccionada?.costo_inscripcion) || 0;

    if (montoPagado > 0 && montoPagado < costoLiga) {
      return `El jugador ya tiene un pago parcial de $${montoPagado.toFixed(2)}. Esta acción completará el pago total.`;
    }

    return 'Esta acción actualizará el estado de la inscripción a confirmado.';
  }

  confirmarPagoModal(): void {
    if (this.inscripcionSeleccionada && !this.inscripcionSeleccionada.pago_confirmado) {
      this.confirmarPago(this.inscripcionSeleccionada);
      this.cerrarModal();
    }
  }

  getMontoPagado(inscripcion: JugadorLiga): number {
    return Number(inscripcion.monto_pagado) || 0;
  }

  puedePagarInscripcion(inscripcion: JugadorLiga): boolean {
    const estadoPago = this.getEstadoPago(inscripcion);
    const costoLiga = this.ligaSeleccionada?.costo_inscripcion || 0;
    return estadoPago !== 'confirmado' && costoLiga > 0;
  }

  actualizarEstadisticas(): void {
    if (this.ligaSeleccionada?.idLiga) {
      this.cargarInscripciones(this.ligaSeleccionada.idLiga);
    }
  }

  getEstadoPago(inscripcion: JugadorLiga): 'confirmado' | 'parcial' | 'pendiente' {
    const montoPagado = Number(inscripcion.monto_pagado) || 0;
    const costoLiga = this.ligaSeleccionada?.costo_inscripcion || 0;
    const pagoConfirmado = Boolean(inscripcion.pago_confirmado);

    if (pagoConfirmado && montoPagado >= costoLiga) {
      return 'confirmado';
    }

    if (montoPagado > 0 && montoPagado < costoLiga) {
      return 'parcial';
    }

    return 'pendiente';
  }

  getEstadoPagoClase(inscripcion: JugadorLiga): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'status-confirmed';
      case 'parcial':
        return 'status-partial';
      case 'pendiente':
      default:
        return 'status-pending';
    }
  }

  getEstadoPagoTexto(inscripcion: JugadorLiga): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'Confirmado';
      case 'parcial':
        return 'Pago Parcial';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  getEstadoPagoIcono(inscripcion: JugadorLiga): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'check-circle';
      case 'parcial':
        return 'clock';
      case 'pendiente':
      default:
        return 'clock';
    }
  }

  getEstadoPagoBadgeStatus(inscripcion: JugadorLiga): BadgeStatus {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'confirmed';
      case 'parcial':
        return 'partial';
      case 'pendiente':
      default:
        return 'pending';
    }
  }

  getEstadoBadgeStatus(estado: string | undefined): BadgeStatus {
    switch (estado) {
      case 'confirmado': return 'confirmed';
      case 'inscrito': return 'pending';
      case 'retirado': return 'retired';
      case 'cancelado': return 'cancelled';
      default: return 'pending';
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
      case 'inscrito': return 'status-pending';
      case 'retirado': return 'status-retired';
      case 'cancelado': return 'status-cancelled';
      default: return '';
    }
  }

  getPorcentajePagosPorGrupo(grupo: EstadisticasGrupo): number {
    return grupo.totalInscritos > 0
      ? (grupo.pagosConfirmados / grupo.totalInscritos) * 100
      : 0;
  }

  verDetalles(inscripcion: JugadorLiga): void {
    this.inscripcionSeleccionada = inscripcion;
    this.modalDetallesVisible = true;
  }

  cerrarModal(): void {
    this.modalDetallesVisible = false;
    this.inscripcionSeleccionada = null;
  }

  editarInscripcion(inscripcion: JugadorLiga): void {
    this.toast.info('Función no disponible', 'La edición de inscripciones de liga estará disponible próximamente');
  }

  eliminarInscripcion(inscripcion: JugadorLiga): void {
    if (!inscripcion.idJugadorLiga) return;

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
    if (!this.inscripcionParaEliminar?.idJugadorLiga) return;

    this.jugadorLigaService.delete(this.inscripcionParaEliminar.idJugadorLiga).subscribe({
      next: () => {
        this.toast.success('Inscripción eliminada', 'La inscripción se eliminó exitosamente');
        this.mostrarModalEliminacion = false;
        this.inscripcionParaEliminar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al eliminar la inscripción:', err);
        const mensaje = err?.error?.message || 'Error al eliminar la inscripción';
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
