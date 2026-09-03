import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { TorneoService } from '../../../../services/torneo';
import { RondaService } from '../../../../services/ronda';
import { MesaService } from '../../../../services/mesa';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

import { Torneo } from '../../../../models/torneo';
import { TorneoCategoria } from '../../../../models/torneo-categoria';
import { Ronda } from '../../../../models/ronda';
import { Mesa } from '../../../../models/mesa';
import { HoraAmPmPipe } from '../../../../pipes/hora-ampm.pipe';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { BadgeComponent } from '../../../../componentes/atoms/badge/badge';

@Component({
  selector: 'app-visualizacion-mesas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastNoti,
    HoraAmPmPipe,
    PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent,
    IconComponent, SelectComponent, BadgeComponent
  ],
  templateUrl: './visualizacion-mesas.html',
  styleUrls: ['./visualizacion-mesas.css']
})
export class VisualizacionMesasComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  // Datos
  torneos: Torneo[] = [];
  torneoSeleccionado: Torneo | null = null;
  categorias: TorneoCategoria[] = [];
  categoriaSeleccionada: TorneoCategoria | null = null;
  rondasDisponibles: Ronda[] = [];
  rondaSeleccionada: number | null = null;
  rondaActualData: Ronda | null = null;
  mesasRonda: Mesa[] = [];

  // Estados
  cargando = false;
  cargandoTorneos = false;
  cargandoCategorias = false;
  cargandoRondas = false;
  cargandoMesas = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private torneoService: TorneoService,
    private rondaService: RondaService,
    private mesaService: MesaService
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
    
    // Leer parámetros de la URL si existen
    this.route.queryParams.subscribe(params => {
      if (params['torneo']) {
        const idTorneo = parseInt(params['torneo']);
        if (!isNaN(idTorneo)) {
          // Esperar a que se carguen los torneos
          setTimeout(() => {
            const torneo = this.torneos.find(t => t.idTorneo === idTorneo);
            if (torneo) {
              this.torneoSeleccionado = torneo;
              this.onTorneoChange();
            }
          }, 500);
        }
      }
    });
  }

  cargarTorneos(): void {
    this.cargandoTorneos = true;
    this.error = null;

    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneos = torneos || [];
        this.actualizarOpcionesSelect();
        this.cargandoTorneos = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los torneos';
        console.error('Error:', err);
        this.cargandoTorneos = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar los torneos');
      }
    });
  }

  onTorneoChange(): void {
    this.categoriaSeleccionada = null;
    this.categorias = [];
    this.rondasDisponibles = [];
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.actualizarOpcionesSelect();

    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarCategorias(this.torneoSeleccionado.idTorneo);
    }
  }

  cargarCategorias(idTorneo: number): void {
    this.cargandoCategorias = true;

    this.torneoService.getCategoriasByTorneo(idTorneo).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
        this.actualizarOpcionesSelect();
        this.cargandoCategorias = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.cargandoCategorias = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las categorías');
      }
    });
  }

  onCategoriaChange(): void {
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];
    this.actualizarOpcionesSelect();

    if (this.categoriaSeleccionada && this.torneoSeleccionado?.idTorneo) {
      const idCategoria = this.categoriaSeleccionada.idCategoria;

      if (idCategoria) {
        this.cargarRondas(this.torneoSeleccionado.idTorneo, idCategoria);
      }
    }
  }

  cargarRondas(idTorneo: number, idCategoria: number): void {
    this.cargandoRondas = true;

    this.rondaService.getRondasByTorneo(idTorneo).subscribe({
      next: (rondas) => {
        const idTorneoCat = this.categoriaSeleccionada?.idTorneoCat;

        if (!idTorneoCat) {
          console.error('No se encontró idTorneoCat');
          this.cargandoRondas = false;
          return;
        }

        this.rondasDisponibles = Array.isArray(rondas)
          ? rondas.filter((r: Ronda) => r.idTorneoCategoria === idTorneoCat)
              .sort((a, b) => a.numeroRonda - b.numeroRonda)
          : [];
        this.actualizarOpcionesSelect();

        if (this.rondasDisponibles.length > 0) {
          // Seleccionar la última ronda por defecto
          const ultimaRonda = this.rondasDisponibles[this.rondasDisponibles.length - 1];
          this.rondaSeleccionada = ultimaRonda.numeroRonda;
          this.rondaActualData = ultimaRonda;
          this.cargarMesasRonda(ultimaRonda.idRonda);
        } else {
          this.cargandoRondas = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.actualizarOpcionesSelect();
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las rondas');
      }
    });
  }

  onRondaChange(): void {
    if (this.rondaSeleccionada) {
      const ronda = this.rondasDisponibles.find(
        r => r.numeroRonda === this.rondaSeleccionada
      );

      if (ronda) {
        this.rondaActualData = ronda;
        this.cargarMesasRonda(ronda.idRonda);
      }
    }
  }

  cargarMesasRonda(idRonda: number): void {
    this.cargandoMesas = true;
    
    this.mesaService.getMesasByRonda(idRonda).subscribe({
      next: (mesas) => {
        this.mesasRonda = Array.isArray(mesas) ? mesas : [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;
      },
      error: (err) => {
        console.error('Error al cargar mesas:', err);
        this.mesasRonda = [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las mesas');
      }
    });
  }

  getMesasFinalizadas(): number {
    return this.mesasRonda.filter(m => m.estado === 'finalizada').length;
  }

  getMesaEstadoClase(estado: string): string {
    return `mesa-${estado}`;
  }

  getEstadoRondaClase(estado: string): string {
    return `status-${estado}`;
  }

  getTipoFinalizacionTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'jaquemate': 'Jaque Mate',
      'tiempo': 'Por Tiempo',
      'rendicion': 'Rendición',
      'ilegales': 'Jugadas Ilegales',
      'incomparecencia': 'Incomparecencia',
      'empate_comun': 'Empate Común',
      'empate_material': 'Empate por Material',
      'empate_50_movidas': 'Empate 50 Movidas',
      'empate_triple_repeticion': 'Triple Repetición',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();

    if (fechaStr.includes('T')) {
      const [datePart] = fechaStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  formatearFechaHora(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  mostrarToast(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje?: string): void {
    if (this.toast) {
      this.toast.show(tipo, titulo, mensaje);
    }
  }

  reintentar(): void {
    this.error = null;
    this.cargarTorneos();
  }

  torneoOptions: SelectOption<Torneo>[] = [];
  categoriaOptions: SelectOption<TorneoCategoria>[] = [];
  rondaOptions: SelectOption<number>[] = [];

  private actualizarOpcionesSelect(): void {
    this.torneoOptions = this.torneos.map(t => ({ value: t, label: `${t.nombre || t.lugar} - ${this.formatearFecha(t.fecha)}` }));
    this.categoriaOptions = this.categorias.map(c => ({ value: c, label: `${c.categoria?.nombre} (${c.rondas} rondas)` }));
    this.rondaOptions = this.rondasDisponibles.map(r => ({
      value: r.numeroRonda,
      label: `Ronda ${r.numeroRonda}${r.estado === 'finalizada' ? ' - Finalizada' : r.estado === 'en_curso' ? ' - En curso' : r.estado === 'pendiente' ? ' - Pendiente' : ''}`
    }));
  }

  onTorneoSelect(torneo: Torneo): void {
    this.torneoSeleccionado = torneo;
    this.onTorneoChange();
  }

  onCategoriaSelect(categoria: TorneoCategoria): void {
    this.categoriaSeleccionada = categoria;
    this.onCategoriaChange();
  }

  onRondaSelect(numeroRonda: number): void {
    this.rondaSeleccionada = numeroRonda;
    this.onRondaChange();
  }

  getEstadoRondaBadgeStatus(estado: string): 'in-progress' | 'finished' | 'scheduled' {
    if (estado === 'finalizada') return 'finished';
    if (estado === 'en_curso') return 'in-progress';
    return 'scheduled';
  }
}
