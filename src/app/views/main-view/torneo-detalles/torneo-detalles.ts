import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TorneoService } from '../../../services/torneo/torneo';
import { TorneoCategoria } from '../../../models/torneo-categoria';
import { Torneo } from '../../../models/torneo';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { SistemaPago } from '../../../models/sistema-pago';

@Component({
  selector: 'app-torneo-detalle',
  standalone: true,
  imports: [CommonModule, ToastNoti],
  templateUrl: './torneo-detalles.html',
  styleUrls: ['./torneo-detalles.css']
})
export class TorneoDetalleComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneo?: Torneo;
  torneoCategorias: TorneoCategoria[] = [];
  sistemaPago?: SistemaPago;
  loading = true;
  torneoId?: number;

  seccionesExpandidas = {
    informacionGeneral: true,
    sistemaPago: true,
    categoriasTorneo: true,
    configuracionPorCategoria: true,
    configuracionAdicional: true,
    notasAdicionales: true
  };

  categoriasExpandidas: { [key: number]: boolean } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private torneoService: TorneoService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.torneoId = +params['id'];
        this.cargarTorneo();
      } else {
        this.router.navigate(['/main-view/torneos']);
      }
    });
  }

  private verificarEstadoTorneo(torneo: Torneo): boolean {
    // Si la fecha del torneo ya pasó, debe estar finalizado
    const fechaTorneo = new Date(torneo.fecha);
    const hoy = new Date();

    // Resetear las horas para comparar solo fechas
    fechaTorneo.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    // Si la fecha del torneo es anterior a hoy, está finalizado
    if (fechaTorneo < hoy) {
      return false; // Finalizado
    }

    return torneo.activo ?? true;
  }

  // Modificar el método cargarTorneo() para aplicar la verificación:

  cargarTorneo(): void {
    if (!this.torneoId) return;

    this.loading = true;
    this.torneoService.getById(this.torneoId).subscribe({
      next: (torneo: Torneo) => {
        this.torneo = {
          ...torneo,
          activo: this.verificarEstadoTorneo(torneo) // Aplicar verificación automática
        };
        this.torneoCategorias = torneo.torneoCategoria || [];

        // Cargar sistema de pago si existe
        if (torneo.sistemaPago || torneo.sistema_pago) {
          this.sistemaPago = torneo.sistemaPago || torneo.sistema_pago;
        }

        // Expandir primera categoría por defecto
        if (this.torneoCategorias.length > 0) {
          this.categoriasExpandidas[0] = true;
        }

        this.loading = false;
      },
      error: (error) => {
        //console.error('Error al cargar torneo:', error);
        //this.mostrarAlerta('Error al cargar los datos del torneo', 'error');
        this.toast.error('Error', 'Error al cargar los datos del torneo');
        this.router.navigate(['/main-view/torneos']);
      }
    });
  }
  toggleSeccion(seccion: keyof typeof this.seccionesExpandidas): void {
    this.seccionesExpandidas[seccion] = !this.seccionesExpandidas[seccion];
  }

  toggleCategoria(index: number): void {
    this.categoriasExpandidas[index] = !this.categoriasExpandidas[index];
  }

  obtenerDireccion(): string {
    if (!this.torneo?.direccion) return '';
    return this.torneo.direccion;
  }

  obtenerTiempoEspera(): number {
    if (!this.torneo?.notas) return 10;

    const notasLineas = this.torneo.notas.split('\n');
    const tiempoEsperaLinea = notasLineas.find(l => l.toLowerCase().includes('tiempo de espera:'));

    if (tiempoEsperaLinea) {
      const match = tiempoEsperaLinea.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 10;
  }

  requiereEquipo(): boolean {
    if (!this.torneo?.notas) return false;

    const notasLineas = this.torneo.notas.split('\n').map(l => l.toLowerCase());
    return notasLineas.some(l =>
      l.includes('deberan presentarse con ajedrez') ||
      l.includes('deben traer su equipo')
    );
  }

  permiteBye(): boolean {
    if (!this.torneo?.notas) return false;

    const notasLineas = this.torneo.notas.split('\n').map(l => l.toLowerCase());
    return notasLineas.some(l =>
      l.includes('solicitar bye') ||
      l.includes('permitir bye')
    );
  }

  obtenerNotasGenerales(): string {
    if (!this.torneo?.notas) return '';

    const notasLineas = this.torneo.notas.split('\n').map(l => l.trim()).filter(l => l !== '');

    const notasGenerales = notasLineas.filter(linea => {
      const lineaLower = linea.toLowerCase();
      return !lineaLower.startsWith('direccion:') &&
        !lineaLower.includes('tiempo de espera:') &&
        !lineaLower.includes('deberan presentarse con ajedrez') &&
        !lineaLower.includes('deben traer su equipo') &&
        !lineaLower.includes('solicitar bye') &&
        !lineaLower.includes('permitir bye') &&
        !lineaLower.includes('desempates:') &&
        !lineaLower.includes('buchholz') &&
        !lineaLower.includes('sonneborn-berger') &&
        !lineaLower.includes('encuentro directo');
    }).join('\n').trim();

    return notasGenerales;
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearFechaHora(fecha: Date | string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora;
  }

  formatearFechaHoraRonda(fechaHora: string): string {
    if (!fechaHora) return 'Sin fecha programada';

    try {
      const date = new Date(fechaHora);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Sin fecha programada';
      }

      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha de ronda:', e);
      return 'Sin fecha programada';
    }
  }

  obtenerPremios(premios: any): string[] {
    if (!premios) return [];

    if (typeof premios === 'string') {
      try {
        premios = JSON.parse(premios);
      } catch (e) {
        return [];
      }
    }

    const premiosArray: string[] = [];
    const nombres = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Septimo', 'Octavo'];

    const claves = Object.keys(premios).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    claves.forEach((key, index) => {
      const match = key.match(/\d+/);
      if (match) {
        const posicion = parseInt(match[0]);
        const nombreLugar = posicion <= nombres.length
          ? `${nombres[posicion - 1]} Lugar`
          : `${posicion}° Lugar`;

        premiosArray.push(`${nombreLugar}: ${premios[key]}`);
      }
    });

    return premiosArray;
  }

  volver(): void {
    this.router.navigate(['/main-view/torneos']);
  }

  editarTorneo(): void {
    if (this.torneoId) {
      this.router.navigate(['/main-view/editar-torneo', this.torneoId]);
    }
  }

  formatearClabe(clabe: string): string {
    if (!clabe) return '';
    // Formato: XXX XXX XXXX XXXX XXXX
    return clabe.replace(/(\d{3})(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5');
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    // Formato: (XXX) XXX-XXXX
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
}