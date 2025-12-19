import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';

import { EstadisticasPagoService } from '../../../services/estadisticas-pago/estadisticas-pago';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { GraficasEstadisticasComponent } from './graficas-estadisticas/graficas-estadisticas';
import { ExportadorReportesComponent } from './exportar-reportes/exportar-reportes';

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
    ExportadorReportesComponent
  ],
  templateUrl: './estadisticas-pagos.html',
  styleUrls: ['./estadisticas-pagos.css']
})
export class EstadisticasPagosComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;
  @ViewChild('exportadorReportes') exportadorReportes!: ExportadorReportesComponent;

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

  estadisticasGenerales: any = null;
  estadisticasPorCategoria: any[] = [];
  estadisticasPorTorneo: any[] = [];
  evolucionTemporal: any[] = [];
  comparativaAnual: any[] = [];

  constructor(private estadisticasService: EstadisticasPagoService) { }

  ngOnInit(): void {
    this.cargarTorneos();
    this.inicializarFlatpickr();
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

    const inputInicio = document.querySelector('#fechaInicioNormal') as HTMLInputElement;
    const inputFin = document.querySelector('#fechaFinNormal') as HTMLInputElement;

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
    if (this.torneoSeleccionado !== null) {
      const torneoSeleccionadoObj = this.torneos.find(t => t.idTorneo === this.torneoSeleccionado);
      if (torneoSeleccionadoObj && torneoSeleccionadoObj.fecha_inicio) {
        const fechaTorneo = torneoSeleccionadoObj.fecha_inicio.split('T')[0];
        this.filtros.fechaInicio = fechaTorneo;
        this.filtros.fechaFin = this.obtenerFechaHoy();
      }
    } else {
      this.filtros.fechaInicio = this.obtenerFechaHaceUnMes();
      this.filtros.fechaFin = this.obtenerFechaHoy();
    }

    setTimeout(() => {
      this.reinicializarFlatpickr();
    }, 50);

    this.cargarEstadisticas();
    
  }

  inicializarFlatpickr(): void {
    setTimeout(() => {
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

      const inputInicio = document.querySelector('#fechaInicioNormal') as HTMLInputElement;
      const inputFin = document.querySelector('#fechaFinNormal') as HTMLInputElement;

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

    const { fechaInicio, fechaFin, tipoPeriodo } = this.filtros;
    const agrupacionAUsar = this.torneoSeleccionado ? 'dia' : tipoPeriodo;

    Promise.all([
      this.estadisticasService.getEstadisticasGenerales(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEstadisticasPorCategoria(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEstadisticasPorTorneo(fechaInicio, fechaFin, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getEvolucionTemporal(fechaInicio, fechaFin, agrupacionAUsar, this.torneoSeleccionado).toPromise(),
      this.estadisticasService.getComparativaAnual(this.torneoSeleccionado).toPromise()
    ]).then(([generales, categorias, torneos, evolucion, comparativa]) => {
      console.log('Evolución temporal recibida:', evolucion);
      this.estadisticasGenerales = generales;
      this.estadisticasPorCategoria = categorias || [];
      this.estadisticasPorTorneo = torneos || [];
      this.evolucionTemporal = evolucion || [];
      this.comparativaAnual = comparativa || [];

      this.cargando = false;
      this.toast.success('Informacion cargada','Estadisticas cargadas correctamente');
    }).catch(error => {
      //this.error = 'Error al cargar las estadísticas';
      this.toast.error('Error','Error al cargar las estadísticas');
      this.cargando = false;
    });
  }

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

    setTimeout(() => {
      this.reinicializarFlatpickr();
    }, 50);
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