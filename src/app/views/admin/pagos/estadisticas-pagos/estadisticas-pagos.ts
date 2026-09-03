import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';

import { EstadisticasPagoService } from '../../../../services/estadisticas-pago';
import { AuthService } from '../../../../services/auth';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { GraficasEstadisticasComponent } from './graficas-estadisticas/graficas-estadisticas';
import { ExportadorReportesComponent } from './exportar-reportes/exportar-reportes';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';

interface FiltrosTemporal {
  fechaInicio: string;
  fechaFin: string;
  tipoPeriodo: 'dia' | 'semana' | 'mes' | 'anio';
}

@Component({
  selector: 'app-estadisticas-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastNoti,
    GraficasEstadisticasComponent,
    ExportadorReportesComponent,
    PageHeaderComponent, ButtonComponent, IconComponent, StateMessageComponent, EmptyStateComponent, StatCardGridComponent
  ],
  templateUrl: './estadisticas-pagos.html',
  styleUrls: ['./estadisticas-pagos.css']
})
export class EstadisticasPagosComponent implements OnInit, AfterViewChecked {
  @ViewChild(ToastNoti) toast!: ToastNoti;
  @ViewChild('exportadorReportes') exportadorReportes!: ExportadorReportesComponent;

  @ViewChild('fechaInicioNormal') fechaInicioNormalRef?: ElementRef<HTMLInputElement>;
  @ViewChild('fechaFinNormal') fechaFinNormalRef?: ElementRef<HTMLInputElement>;

  // Igual que en Inscripciones Generales: se marca cuando hay que (re)enlazar flatpickr
  // y se consume en ngAfterViewChecked, que Angular garantiza corre después de que el
  // DOM (incluido el *ngIf que revela estos inputs) ya está actualizado — reemplaza los
  // setTimeout(...) adivinados que fallaban de forma intermitente.
  private pendingFlatpickrNormalInit = false;

  cargando = false;
  error: string | null = null;
  modoComparativa = false;
  torneos: any[] = [];
  torneoSeleccionado: number | null = null;

  comparativa = {
    periodo1: {
      nombre: 'Período 1',
      fechaInicio: '',
      fechaFin: '',
      datos: null as any
    },
    periodo2: {
      nombre: 'Período 2',
      fechaInicio: '',
      fechaFin: '',
      datos: null as any
    },
    resultados: null as any
  };

  filtros: FiltrosTemporal = {
    fechaInicio: this.obtenerFechaHaceUnMes(),
    fechaFin: this.obtenerFechaHoy(),
    tipoPeriodo: 'mes'
  };

  /** Por defecto el filtro de fecha está apagado: se muestran las estadísticas
   *  reales del torneo seleccionado (o de todos), sin acotar por fecha. */
  filtroFechaActivo = false;

  estadisticasGenerales: any = null;
  resumenStats: StatCardInput[] = [];
  estadisticasPorCategoria: any[] = [];
  estadisticasPorTorneo: any[] = [];
  evolucionTemporal: any[] = [];
  comparativaAnual: any[] = [];

  constructor(
    private estadisticasService: EstadisticasPagoService,
    private authService: AuthService
  ) { }

  /** adminTorneo solo tiene acceso a su(s) propio(s) torneo(s) asignado(s) —
   * la opción "Todos los torneos" (agregando entre varios) no aplica y solo
   * genera confusión sobre qué está viendo. */
  get esAdminGral(): boolean {
    return this.authService.currentUserValue?.rol === 'adminGral';
  }

  ngOnInit(): void {
    this.cargarTorneos();
    // Flatpickr del modo normal se enlaza tras la primera carga (ver cargarEstadisticas);
    // el del modo comparativa se enlaza al activar ese modo (ver toggleModoComparativa).
  }

  ngAfterViewChecked(): void {
    if (this.pendingFlatpickrNormalInit && this.fechaInicioNormalRef && this.fechaFinNormalRef) {
      this.pendingFlatpickrNormalInit = false;
      this.reinicializarFlatpickr();
    }
  }

  cargarTorneos(): void {
    this.estadisticasService.getTorneos().subscribe({
      next: (torneos) => {
        this.torneos = torneos.sort((a, b) => {
          const fechaA = new Date(a.fecha_inicio).getTime();
          const fechaB = new Date(b.fecha_inicio).getTime();
          return fechaB - fechaA;
        });

        const hoy = new Date();
        const torneoProximo = this.torneos.find(t => new Date(t.fecha_inicio) >= hoy);

        if (torneoProximo) {
          this.torneoSeleccionado = torneoProximo.idTorneo;
        } else if (this.torneos.length > 0) {
          this.torneoSeleccionado = this.torneos[0].idTorneo;
        }

        // El torneo actual/más reciente se carga SIN filtro de fecha por defecto:
        // las inscripciones ocurren antes de la fecha del torneo, así que acotar
        // el rango a partir de esa fecha excluía casi todas y dejaba todo en $0.
        // El filtro de fecha es opt-in (ver filtroFechaActivo / checkbox en la vista).
        this.cargarEstadisticas();
      },
      error: (error) => {
        console.error('Error al cargar torneos:', error);
        this.error = 'Error al cargar los torneos';
      }
    });
  }

  reinicializarFlatpickr(): void {
    const opcionesFlatpickr: any = {
      dateFormat: 'Y-m-d',
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        },
        months: {
          shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
      }
    };

    const inputInicio = this.fechaInicioNormalRef?.nativeElement;
    const inputFin = this.fechaFinNormalRef?.nativeElement;

    if (inputInicio && (inputInicio as any)._flatpickr) {
      (inputInicio as any)._flatpickr.destroy();
    }
    if (inputFin && (inputFin as any)._flatpickr) {
      (inputFin as any)._flatpickr.destroy();
    }

    if (inputInicio) {
      flatpickr(inputInicio, {
        ...opcionesFlatpickr,
        defaultDate: this.filtros.fechaInicio,
        onChange: (selectedDates, dateStr) => {
          this.filtros.fechaInicio = dateStr;
        }
      });
    }

    if (inputFin) {
      flatpickr(inputFin, {
        ...opcionesFlatpickr,
        defaultDate: this.filtros.fechaFin,
        onChange: (selectedDates, dateStr) => {
          this.filtros.fechaFin = dateStr;
        }
      });
    }
  }

  onTorneoChange(): void {
    // El cambio de torneo no toca el filtro de fecha (ver filtroFechaActivo):
    // solo cambia el alcance (idTorneo) con el que se recargan las estadísticas.
    this.cargarEstadisticas();
  }

  /** Checkbox + botón "Aplicar": activa el filtro de fecha y recarga con él. */
  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = true;
    this.cargarEstadisticas();
  }

  /** Botón "Quitar filtro": vuelve a mostrar el torneo/histórico sin acotar por fecha. */
  quitarFiltroFecha(): void {
    this.filtroFechaActivo = false;
    this.cargarEstadisticas();
  }

  inicializarFlatpickr(): void {
    setTimeout(() => {
      // Reutiliza reinicializarFlatpickr() para #fechaInicioNormal/#fechaFinNormal:
      // esa función destruye cualquier instancia previa antes de crear una nueva,
      // evitando dos instancias de flatpickr peleando por el mismo input (lo que
      // deja el calendario sin responder a los clics) si algo más — por ejemplo
      // la selección de torneo por defecto al cargar la página — también intenta
      // (re)inicializarlo casi al mismo tiempo.
      this.reinicializarFlatpickr();

      const opcionesFlatpickr: any = {
        dateFormat: 'Y-m-d',
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          },
          months: {
            shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
          }
        }
      };

      const inputP1Inicio = document.querySelector('#fechaP1Inicio') as HTMLInputElement;
      const inputP1Fin = document.querySelector('#fechaP1Fin') as HTMLInputElement;
      const inputP2Inicio = document.querySelector('#fechaP2Inicio') as HTMLInputElement;
      const inputP2Fin = document.querySelector('#fechaP2Fin') as HTMLInputElement;

      if (inputP1Inicio) {
        flatpickr(inputP1Inicio, {
          ...opcionesFlatpickr,
          onChange: (selectedDates, dateStr) => {
            this.comparativa.periodo1.fechaInicio = dateStr;
          }
        });
      }

      if (inputP1Fin) {
        flatpickr(inputP1Fin, {
          ...opcionesFlatpickr,
          onChange: (selectedDates, dateStr) => {
            this.comparativa.periodo1.fechaFin = dateStr;
          }
        });
      }

      if (inputP2Inicio) {
        flatpickr(inputP2Inicio, {
          ...opcionesFlatpickr,
          onChange: (selectedDates, dateStr) => {
            this.comparativa.periodo2.fechaInicio = dateStr;
          }
        });
      }

      if (inputP2Fin) {
        flatpickr(inputP2Fin, {
          ...opcionesFlatpickr,
          onChange: (selectedDates, dateStr) => {
            this.comparativa.periodo2.fechaFin = dateStr;
          }
        });
      }
    }, 100);
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;

    // Los filtros de fecha solo aplican cuando el usuario los activa explícitamente
    // (checkbox + botón Aplicar). Por defecto se muestran los datos reales del
    // torneo seleccionado (o de todos) sin acotar por fecha.
    const fechaInicio = this.filtroFechaActivo ? this.filtros.fechaInicio : undefined;
    const fechaFin = this.filtroFechaActivo ? this.filtros.fechaFin : undefined;
    const agrupacionAUsar = this.torneoSeleccionado ? 'dia' : this.filtros.tipoPeriodo;

    Promise.all([
      this.estadisticasService.getEstadisticasGenerales(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEstadisticasPorCategoria(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEstadisticasPorTorneo(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEvolucionTemporal(fechaInicio, fechaFin, agrupacionAUsar, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getComparativaAnual(this.torneoSeleccionado).toPromise()
    ]).then(([generales, categorias, torneos, evolucion, comparativa]) => {
      this.estadisticasGenerales = generales;
      this.estadisticasPorCategoria = categorias || [];
      this.estadisticasPorTorneo = torneos || [];
      this.evolucionTemporal = evolucion || [];
      this.comparativaAnual = comparativa || [];
      this.actualizarResumenStats();

      this.cargando = false;
      // ngAfterViewChecked enlaza flatpickr en cuanto los inputs existan en el DOM
      // (ver pendingFlatpickrNormalInit) — evita adivinar con un setTimeout.
      this.pendingFlatpickrNormalInit = true;
      this.toast.success('Informacion cargada','Estadisticas cargadas correctamente');
    }).catch(error => {
      //this.error = 'Error al cargar las estadísticas';
      this.toast.error('Error','Error al cargar las estadísticas');
      this.cargando = false;
    });
  }

  /**
   * Solo calcula el rango de fechas del período rápido elegido y lo refleja en los
   * inputs de flatpickr. NO recarga las estadísticas por sí solo — el usuario debe
   * marcar el checkbox de filtro (si no lo está) y pulsar "Aplicar" para que el
   * filtro de tiempo realmente se aplique (ver aplicarFiltroFecha).
   */
  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'anio'): void {
    this.filtros.tipoPeriodo = periodo;

    const hoy = new Date();
    let fechaInicio = new Date();

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(hoy);
        break;
      case 'semana':
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case 'anio':
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        break;
    }

    this.filtros.fechaInicio = fechaInicio.toISOString().split('T')[0];
    this.filtros.fechaFin = hoy.toISOString().split('T')[0];

    // Los inputs ya están en el DOM en este punto (no hay carga de red de por medio).
    this.reinicializarFlatpickr();
  }

  exportarReporte(): void {
    this.exportadorReportes.exportarReporte();
  }

  toggleModoComparativa(): void {
    this.modoComparativa = !this.modoComparativa;

    if (this.modoComparativa) {
      const hoy = new Date();
      const mesAnterior = new Date();
      mesAnterior.setMonth(hoy.getMonth() - 1);
      const dosMesesAntes = new Date();
      dosMesesAntes.setMonth(hoy.getMonth() - 2);

      this.comparativa.periodo1.fechaInicio = dosMesesAntes.toISOString().split('T')[0];
      this.comparativa.periodo1.fechaFin = mesAnterior.toISOString().split('T')[0];

      this.comparativa.periodo2.fechaInicio = mesAnterior.toISOString().split('T')[0];
      this.comparativa.periodo2.fechaFin = hoy.toISOString().split('T')[0];

      setTimeout(() => this.inicializarFlatpickr(), 100);
    } else {
      this.comparativa.resultados = null;
    }
  }

  compararPeriodos(): void {
    this.cargando = true;
    this.error = null;

    Promise.all([
      this.estadisticasService.getEstadisticasGenerales(
        this.comparativa.periodo1.fechaInicio,
        this.comparativa.periodo1.fechaFin
      ).toPromise(),
      this.estadisticasService.getEstadisticasGenerales(
        this.comparativa.periodo2.fechaInicio,
        this.comparativa.periodo2.fechaFin
      ).toPromise()
    ]).then(([datos1, datos2]) => {
      this.comparativa.periodo1.datos = datos1;
      this.comparativa.periodo2.datos = datos2;

      this.comparativa.resultados = {
        totalInscripciones: {
          periodo1: datos1.total_inscripciones,
          periodo2: datos2.total_inscripciones,
          diferencia: datos2.total_inscripciones - datos1.total_inscripciones,
          porcentaje: this.calcularPorcentajeCambio(datos1.total_inscripciones, datos2.total_inscripciones)
        },
        totalRecaudado: {
          periodo1: datos1.total_recaudado,
          periodo2: datos2.total_recaudado,
          diferencia: datos2.total_recaudado - datos1.total_recaudado,
          porcentaje: this.calcularPorcentajeCambio(datos1.total_recaudado, datos2.total_recaudado)
        },
        porcentajeRecaudacion: {
          periodo1: datos1.porcentaje_recaudacion,
          periodo2: datos2.porcentaje_recaudacion,
          diferencia: datos2.porcentaje_recaudacion - datos1.porcentaje_recaudacion,
          porcentaje: this.calcularPorcentajeCambio(datos1.porcentaje_recaudacion, datos2.porcentaje_recaudacion)
        },
        pagosCompletos: {
          periodo1: datos1.pagos_completos,
          periodo2: datos2.pagos_completos,
          diferencia: datos2.pagos_completos - datos1.pagos_completos,
          porcentaje: this.calcularPorcentajeCambio(datos1.pagos_completos, datos2.pagos_completos)
        },
        promedioPago: {
          periodo1: datos1.promedio_pago,
          periodo2: datos2.promedio_pago,
          diferencia: datos2.promedio_pago - datos1.promedio_pago,
          porcentaje: this.calcularPorcentajeCambio(datos1.promedio_pago, datos2.promedio_pago)
        }
      };

      this.cargando = false;
      this.toast.success('Comparativa generada', 'Los períodos se han comparado exitosamente');
    }).catch(error => {
      console.error('Error al comparar períodos:', error);
      this.error = 'Error al comparar los períodos';
      this.cargando = false;
      this.toast.error('Error en la comparativa', 'No se pudieron cargar los datos de los períodos');
    });
  }

  private calcularPorcentajeCambio(valorAnterior: number, valorActual: number): number {
    if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
    return ((valorActual - valorAnterior) / valorAnterior) * 100;
  }

  private obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private obtenerFechaHaceUnMes(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha.toISOString().split('T')[0];
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor || 0);
  }

  private actualizarResumenStats(): void {
    if (!this.estadisticasGenerales) {
      this.resumenStats = [];
      return;
    }
    const g = this.estadisticasGenerales;
    this.resumenStats = [
      { icon: 'bank', variant: 'brown', label: 'Total Recaudado', value: this.formatearMoneda(g.total_recaudado), sub: `${g.porcentaje_recaudacion}% del esperado` },
      { icon: 'check-circle', variant: 'success', label: 'Pagos Completos', value: g.pagos_completos, sub: `de ${g.total_inscripciones} inscripciones` },
      { icon: 'clock', variant: 'warning', label: 'Pagos Parciales', value: g.pagos_parciales, sub: 'Pendientes de completar' },
      { icon: 'x-circle', variant: 'navy', label: 'Sin Pago', value: g.sin_pago, sub: 'Requieren atención' },
      { icon: 'chart-pie', variant: 'info', label: 'Promedio por Pago', value: this.formatearMoneda(g.promedio_pago), sub: 'Ingreso medio' },
      { icon: 'crown', variant: 'purple', label: 'Total Esperado', value: this.formatearMoneda(g.total_esperado), sub: 'Meta de ingresos' }
    ];
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const fechaSinHora = fecha.split('T')[0];
    const [year, month, day] = fechaSinHora.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);

    return fechaLocal.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
