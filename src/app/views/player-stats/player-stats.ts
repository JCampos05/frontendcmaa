import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JugadorService } from '../../services/jugador/jugador';

interface JugadorResultado {
  idJugador: number;
  nombre: string;
  apellido1: string;
  apellido2?: string;
  rating: number;
  estado?: string;
  pago_confirmado?: boolean | null;
  estado_inscripcion?: string | null;
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './player-stats.html',
  styleUrls: ['./player-stats.css']
})
export class PlayerStatsComponent implements OnInit {
  searchNombre: string = '';
  searchApellido1: string = '';
  searchApellido2: string = '';
  buscando: boolean = false;
  resultadosBusqueda: JugadorResultado[] = [];
  sinResultados: boolean = false;

  jugadorSeleccionado: any = null;
  cargandoStats: boolean = false;
  errorStats: string = '';

  tabActivo: 'ultimo' | 'historial' = 'ultimo';

  constructor(private jugadorService: JugadorService) { }

  ngOnInit(): void { }

  buscarJugadores(): void {
    if (!this.searchNombre.trim() && !this.searchApellido1.trim()) {
      return;
    }

    this.buscando = true;
    this.sinResultados = false;
    this.jugadorSeleccionado = null;
    this.errorStats = '';

    console.log('Buscando jugadores con:', {
      nombre: this.searchNombre.trim() || undefined,
      apellido1: this.searchApellido1.trim() || undefined,
      apellido2: this.searchApellido2.trim() || undefined
    });

    this.jugadorService.search(
      this.searchNombre.trim() || undefined,
      this.searchApellido1.trim() || undefined,
      this.searchApellido2.trim() || undefined
    ).subscribe({
      next: (jugadores: any) => {
        console.log('Jugadores encontrados:', jugadores);
        console.log('Primer jugador completo:', JSON.stringify(jugadores[0], null, 2));
        this.resultadosBusqueda = jugadores;
        this.sinResultados = jugadores.length === 0;
        this.buscando = false;
      },
      error: (error) => {
        console.error('Error al buscar jugadores:', error);
        this.buscando = false;
        this.sinResultados = true;
        this.errorStats = 'Error al buscar jugadores. Por favor intenta de nuevo.';
      }
    });
  }

  seleccionarJugador(jugador: JugadorResultado): void {
    this.cargandoStats = true;
    this.errorStats = '';

    console.log('Cargando estadísticas para jugador:', jugador);

    this.jugadorService.getPublicStats(jugador.idJugador).subscribe({
      next: (data) => {
        console.log('Estadísticas recibidas:', data);
        this.jugadorSeleccionado = data;
        this.cargandoStats = false;
        this.resultadosBusqueda = [];
        this.sinResultados = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.errorStats = 'No se pudieron cargar las estadísticas del jugador';
        this.cargandoStats = false;
      }
    });
  }

  cambiarTab(tab: 'ultimo' | 'historial'): void {
    this.tabActivo = tab;
  }

  nuevaBusqueda(): void {
    this.jugadorSeleccionado = null;
    this.searchNombre = '';
    this.searchApellido1 = '';
    this.searchApellido2 = '';
    this.resultadosBusqueda = [];
    this.sinResultados = false;
  }

  formatearFecha(fecha: string | Date): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getNombreCompleto(jugador: any): string {
    return `${jugador.nombre} ${jugador.apellido1}${jugador.apellido2 ? ' ' + jugador.apellido2 : ''}`;
  }

  getEstadoLabel(estado: string): string {
    const estados: { [key: string]: string } = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'retirado': 'Retirado'
    };
    return estados[estado] || 'Activo';
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado || 'activo'}`;
  }

  getPagoLabel(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'Pago Confirmado' : 'Pago Pendiente';
  }

  getPagoClass(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'pago-confirmado' : 'pago-pendiente';
  }

  getPagoIcon(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'fa-circle-check' : 'fa-circle-xmark';
  }
}