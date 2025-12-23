import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TorneoService } from '../../../services/torneo/torneo';
import { InscripcionService } from '../../../services/inscripcion/inscripcion';
import { Torneo } from '../../../models/torneo';
import { Inscripcion } from '../../../models/inscripcion';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

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
  imports: [CommonModule, FormsModule, ToastNoti],
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

  columnaOrden: string = 'rating';
  direccionOrden: 'ASC' | 'DESC' = 'DESC';

  constructor(
    private torneoService: TorneoService,
    private inscripcionService: InscripcionService
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.cargando = true;
    this.error = null;

    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneos = torneos.sort((a, b) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });

        if (this.torneos.length > 0) {
          // Buscar el torneo actual (dentro del rango de fechas)
          const torneoActual = this.torneos.find(t => this.esTorneoActual(t));
          this.torneoSeleccionado = torneoActual || this.torneos[0];

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.error = 'No hay torneos registrados';
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

  onTorneoSeleccionadoChange(): void {
    if (this.torneoSeleccionado?.idTorneo) {
      this.categoriaSeleccionada = null;
      this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
      this.toast.success('Torneo encontrado', 'Torneo seleccionado y cargado correctamente');
    }
  }

  esTorneoActual(torneo: Torneo): boolean {
    if (!torneo || !torneo.fecha) return false;

    const fechaTorneo = new Date(torneo.fecha);
    fechaTorneo.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diferenciaDias = Math.floor((fechaTorneo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    // Filtrar torneos en el rango válido (-3 a +7 días)
    const torneosEnRango = this.torneos.filter(t => {
      if (!t || !t.fecha) return false;
      const ft = new Date(t.fecha);
      ft.setHours(0, 0, 0, 0);
      const diff = Math.floor((ft.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= -3 && diff <= 7;
    });

    if (torneosEnRango.length === 0) return false;

    // Buscar el torneo HOY
    const torneoHoy = torneosEnRango.find(t => {
      const ft = new Date(t.fecha);
      ft.setHours(0, 0, 0, 0);
      return ft.getTime() === hoy.getTime();
    });

    if (torneoHoy) {
      return torneo.idTorneo === torneoHoy.idTorneo;
    }

    // Buscar torneos futuros (dentro de los próximos 7 días)
    const torneosFuturos = torneosEnRango
      .filter(t => {
        const ft = new Date(t.fecha);
        ft.setHours(0, 0, 0, 0);
        return ft.getTime() > hoy.getTime();
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (torneosFuturos.length > 0) {
      // El más cercano en el futuro es el actual
      return torneo.idTorneo === torneosFuturos[0].idTorneo;
    }

    // Si no hay torneos futuros, buscar el más reciente del pasado (últimos 3 días)
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
      const edad = insc.jugador?.edad || 0;

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
      const ratings = cat.jugadores
        .map(j => j.jugador?.rating || 0)
        .filter(r => r > 0);

      cat.ratingPromedio = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      const edades = cat.jugadores
        .map(j => j.jugador?.edad || 0)
        .filter(e => e > 0);

      cat.edadPromedio = edades.length > 0
        ? edades.reduce((a, b) => a + b, 0) / edades.length
        : 0;

      if (cat.ratingMasBajo === 9999) cat.ratingMasBajo = 0;
      if (cat.edadMasBaja === 999) cat.edadMasBaja = 0;
    });

    this.estadisticasPorCategoria = Array.from(categorias.values());

    const totalJugadores = inscripciones.length;
    const ratings = inscripciones
      .map(i => i.jugador?.rating || 0)
      .filter(r => r > 0);
    const edades = inscripciones
      .map(i => i.jugador?.edad || 0)
      .filter(e => e > 0);

    this.estadisticasGenerales = {
      totalJugadores,
      ratingPromedio: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      edadPromedio: edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0,
      categorias: categorias.size
    };
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionada = idCategoria;
  }

  getJugadoresFiltrados(): Inscripcion[] {
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
        case 'rating':
          valorA = a.jugador?.rating || 0;
          valorB = b.jugador?.rating || 0;
          break;
        case 'edad':
          valorA = a.jugador?.edad || 0;
          valorB = b.jugador?.edad || 0;
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

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'DESC';
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

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return '-';

    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (telefonoLimpio.length === 10) {
      return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    return telefono;
  }
}