import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TorneoService } from '../../../../services/torneo';
import { InscripcionService } from '../../../../services/inscripcion';
import { Torneo } from '../../../../models/torneo';
import { Inscripcion } from '../../../../models/inscripcion';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { FilterChipsComponent, FilterChipOption } from '../../../../componentes/molecules/filter-chips/filter-chips';
import { DataTableComponent, DataTableColumn, SortDirection } from '../../../../componentes/organisms/data-table/data-table';

interface EstadisticasCategoria {
  idCategoria: number;
  nombreCategoria: string;
  totalJugadores: number;
  ratingPromedio: number;
  ratingMasAlto: number;
  ratingMasBajo: number;
  edadPromedio: number;
  edadMasAlta: number;
  edadMasBaja: number;
  jugadores: Inscripcion[];
}

interface EstadisticasGenerales {
  totalJugadores: number;
  ratingPromedio: number;
  edadPromedio: number;
  categorias: number;
}

@Component({
  selector: 'app-jugadores-torneo',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToastNoti, PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent,
    IconComponent, SelectComponent, StatCardGridComponent, FilterChipsComponent, DataTableComponent
  ],
  templateUrl: './jugadores-torneo.html',
  styleUrls: ['./jugadores-torneo.css']
})
export class JugadoresTorneoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneos: Torneo[] = [];
  torneoSeleccionado: Torneo | null = null;
  inscripciones: Inscripcion[] = [];

  estadisticasGenerales: EstadisticasGenerales | null = null;
  estadisticasPorCategoria: EstadisticasCategoria[] = [];
  categoriaSeleccionada: number | null = null;

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  columnaOrden = 'rating';
  direccionOrden: SortDirection = 'DESC';

  readonly columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre Completo', icon: 'user', sortable: true },
    { key: 'telefono', label: 'Teléfono', icon: 'phone' },
    { key: 'categoria', label: 'Categoría', icon: 'stack', sortable: true },
    { key: 'rating', label: 'Rating', icon: 'star', sortable: true, align: 'center' },
    { key: 'edad', label: 'Edad', icon: 'calendar', sortable: true, align: 'center' }
  ];

  // Derivados precalculados (NUNCA getters/métodos que devuelvan arrays nuevos en el
  // template — Angular los reevalúa en cada ciclo de detección de cambios y con
  // *ngFor sin trackBy eso causa NG0103 "infinite change detection").
  torneoOptions: SelectOption<Torneo>[] = [];
  columnsVisibles: DataTableColumn[] = [];
  categoriaFilterOptions: FilterChipOption[] = [];
  categoriaFilterActive = 'todas';
  statCards: StatCardInput[] = [];
  jugadoresFiltrados: Inscripcion[] = [];

  constructor(
    private torneoService: TorneoService,
    private inscripcionService: InscripcionService
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  private actualizarDerivados(): void {
    this.torneoOptions = this.torneos.map(t => ({ value: t, label: `${t.nombre} - ${this.formatearFecha(t.fecha)}` }));

    this.columnsVisibles = this.categoriaSeleccionada === null
      ? this.columns
      : this.columns.filter(c => c.key !== 'categoria');

    this.categoriaFilterOptions = [
      { value: 'todas', label: 'Todas las Categorías', icon: 'stack' },
      ...this.estadisticasPorCategoria.map(cat => ({
        value: String(cat.idCategoria),
        label: cat.nombreCategoria,
        icon: 'grid-four',
        count: cat.totalJugadores
      }))
    ];

    this.categoriaFilterActive = this.categoriaSeleccionada === null ? 'todas' : String(this.categoriaSeleccionada);

    this.statCards = !this.estadisticasGenerales ? [] : [
      { icon: 'users', variant: 'info', label: 'Total Jugadores', value: this.estadisticasGenerales.totalJugadores },
      { icon: 'stack', variant: 'purple', label: 'Categorías', value: this.estadisticasGenerales.categorias },
      { icon: 'chart-line', variant: 'brown', label: 'Rating Promedio', value: Math.round(this.estadisticasGenerales.ratingPromedio) },
      { icon: 'cake', variant: 'teal', label: 'Edad Promedio', value: `${Math.round(this.estadisticasGenerales.edadPromedio)} años` }
    ];

    this.jugadoresFiltrados = this.calcularJugadoresFiltrados();
  }

  cargarTorneos(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneos = torneos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.actualizarDerivados();

        if (this.torneos.length > 0) {
          const torneoActual = this.torneos.find(t => this.esTorneoActual(t));
          this.torneoSeleccionado = torneoActual || this.torneos[0];

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.sinDatos = 'No hay torneos registrados';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los torneos';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onTorneoSeleccionadoChange(torneo: Torneo): void {
    this.torneoSeleccionado = torneo;
    if (torneo?.idTorneo) {
      this.categoriaSeleccionada = null;
      this.cargarInscripciones(torneo.idTorneo);
      this.toast.success('Torneo encontrado', 'Torneo seleccionado y cargado correctamente');
    }
  }

  esTorneoActual(torneo: Torneo): boolean {
    if (!torneo || !torneo.fecha) return false;

    const fechaTorneo = new Date(torneo.fecha);
    fechaTorneo.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const torneosEnRango = this.torneos.filter(t => {
      if (!t || !t.fecha) return false;
      const ft = new Date(t.fecha);
      ft.setHours(0, 0, 0, 0);
      const diff = Math.floor((ft.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= -3 && diff <= 7;
    });

    if (torneosEnRango.length === 0) return false;

    const torneoHoy = torneosEnRango.find(t => {
      const ft = new Date(t.fecha);
      ft.setHours(0, 0, 0, 0);
      return ft.getTime() === hoy.getTime();
    });

    if (torneoHoy) {
      return torneo.idTorneo === torneoHoy.idTorneo;
    }

    const torneosFuturos = torneosEnRango
      .filter(t => {
        const ft = new Date(t.fecha);
        ft.setHours(0, 0, 0, 0);
        return ft.getTime() > hoy.getTime();
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (torneosFuturos.length > 0) {
      return torneo.idTorneo === torneosFuturos[0].idTorneo;
    }

    const torneosPasados = torneosEnRango
      .filter(t => {
        const ft = new Date(t.fecha);
        ft.setHours(0, 0, 0, 0);
        return ft.getTime() < hoy.getTime();
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    if (torneosPasados.length > 0) {
      return torneo.idTorneo === torneosPasados[0].idTorneo;
    }

    return false;
  }

  cargarInscripciones(idTorneo: number): void {
    this.cargando = true;
    this.error = null;

    this.inscripcionService.getByTorneo(idTorneo).subscribe({
      next: (inscripciones) => {
        this.inscripciones = inscripciones;
        this.procesarEstadisticas(inscripciones);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las inscripciones';
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
          totalJugadores: 0,
          ratingPromedio: 0,
          ratingMasAlto: 0,
          ratingMasBajo: 9999,
          edadPromedio: 0,
          edadMasAlta: 0,
          edadMasBaja: 999,
          jugadores: []
        });
      }

      const cat = categorias.get(idCat)!;
      cat.jugadores.push(insc);
      cat.totalJugadores++;

      const rating = insc.jugador?.rating || 0;
      const edad = insc.edad || 0;

      if (rating > 0) {
        cat.ratingMasAlto = Math.max(cat.ratingMasAlto, rating);
        cat.ratingMasBajo = Math.min(cat.ratingMasBajo, rating);
      }

      if (edad > 0) {
        cat.edadMasAlta = Math.max(cat.edadMasAlta, edad);
        cat.edadMasBaja = Math.min(cat.edadMasBaja, edad);
      }
    });

    categorias.forEach(cat => {
      const ratings = cat.jugadores.map(j => j.jugador?.rating || 0).filter(r => r > 0);
      cat.ratingPromedio = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const edades = cat.jugadores.map(j => j.edad || 0).filter(e => e > 0);
      cat.edadPromedio = edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0;

      if (cat.ratingMasBajo === 9999) cat.ratingMasBajo = 0;
      if (cat.edadMasBaja === 999) cat.edadMasBaja = 0;
    });

    this.estadisticasPorCategoria = Array.from(categorias.values());

    const totalJugadores = inscripciones.length;
    const ratings = inscripciones.map(i => i.jugador?.rating || 0).filter(r => r > 0);
    const edades = inscripciones.map(i => i.edad || 0).filter(e => e > 0);

    this.estadisticasGenerales = {
      totalJugadores,
      ratingPromedio: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      edadPromedio: edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0,
      categorias: categorias.size
    };

    this.actualizarDerivados();
  }

  onCategoriaFilterChange(value: string): void {
    this.categoriaSeleccionada = value === 'todas' ? null : Number(value);
    this.actualizarDerivados();
  }

  private calcularJugadoresFiltrados(): Inscripcion[] {
    let jugadores: Inscripcion[] = [];

    if (this.categoriaSeleccionada === null) {
      jugadores = this.estadisticasPorCategoria.flatMap(c => c.jugadores);
    } else {
      const cat = this.estadisticasPorCategoria.find(c => c.idCategoria === this.categoriaSeleccionada);
      jugadores = cat?.jugadores || [];
    }

    jugadores.sort((a, b) => {
      let valorA: any, valorB: any;

      switch (this.columnaOrden) {
        case 'nombre':
          valorA = `${a.jugador?.nombre || ''} ${a.jugador?.apellido1 || ''}`;
          valorB = `${b.jugador?.nombre || ''} ${b.jugador?.apellido1 || ''}`;
          break;
        case 'edad':
          valorA = a.edad || 0;
          valorB = b.edad || 0;
          break;
        case 'categoria':
          valorA = a.categoria?.nombre || '';
          valorB = b.categoria?.nombre || '';
          break;
        default:
          valorA = a.jugador?.rating || 0;
          valorB = b.jugador?.rating || 0;
      }

      if (this.direccionOrden === 'ASC') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

    return jugadores;
  }

  onSortChange(event: { key: string; dir: SortDirection }): void {
    this.columnaOrden = event.key;
    this.direccionOrden = event.dir;
    this.jugadoresFiltrados = this.calcularJugadoresFiltrados();
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return '-';

    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (telefonoLimpio.length === 10) {
      return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    return telefono;
  }
}
