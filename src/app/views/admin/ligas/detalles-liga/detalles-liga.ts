import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { InfoLigaService } from '../../../../services/info-liga';
import { GrupoLigaService } from '../../../../services/grupo-liga';
import { InfoLiga } from '../../../../models/infoLiga';
import { GrupoLiga } from '../../../../models/grupoLiga';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { BadgeComponent } from '../../../../componentes/atoms/badge/badge';

@Component({
  selector: 'app-detalle-liga',
  standalone: true,
  imports: [
    CommonModule, ToastNoti, PageHeaderComponent, StateMessageComponent,
    IconComponent, ButtonComponent, IconButtonComponent, BadgeComponent
  ],
  templateUrl: './detalles-liga.html',
  styleUrls: ['./detalles-liga.css']
})
export class DetalleLigaComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  liga?: InfoLiga;
  grupos: GrupoLiga[] = [];
  loading = true;
  ligaId?: number;

  seccionesExpandidas = {
    informacionGeneral: true,
    gruposLiga: true,
    configuracionPorGrupo: true,
    notasAdicionales: true
  };

  gruposExpandidos: { [key: number]: boolean } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.ligaId = +params['id'];
        this.cargarLiga();
      } else {
        this.router.navigate(['/main-view/ligas']);
      }
    });
  }

  private verificarEstadoLiga(liga: InfoLiga): boolean {
    if (liga.fecha_fin) {
      const fechaFin = new Date(liga.fecha_fin);
      const hoy = new Date();

      fechaFin.setHours(0, 0, 0, 0);
      hoy.setHours(0, 0, 0, 0);

      if (fechaFin < hoy) {
        return false;
      }
    }

    return liga.activo !== 0;
  }

  cargarLiga(): void {
    if (!this.ligaId) return;

    this.loading = true;
    this.infoLigaService.getById(this.ligaId).subscribe({
      next: (liga: InfoLiga) => {
        this.liga = {
          ...liga,
          activo: this.verificarEstadoLiga(liga) ? 1 : 0
        };
        
        this.cargarGrupos();
      },
      error: (error) => {
        this.toast.error('Error', 'Error al cargar los datos de la liga');
        this.router.navigate(['/main-view/ligas']);
      }
    });
  }

  cargarGrupos(): void {
    if (!this.ligaId) return;

    this.grupoLigaService.getByLiga(this.ligaId).subscribe({
      next: (grupos: GrupoLiga[]) => {
        this.grupos = grupos || [];
        
        if (this.grupos.length > 0) {
          this.gruposExpandidos[0] = true;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar grupos:', error);
        this.grupos = [];
        this.loading = false;
      }
    });
  }

  toggleSeccion(seccion: keyof typeof this.seccionesExpandidas): void {
    this.seccionesExpandidas[seccion] = !this.seccionesExpandidas[seccion];
  }

  toggleGrupo(index: number): void {
    this.gruposExpandidos[index] = !this.gruposExpandidos[index];
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

  getTipoSistema(tipo?: string): string {
    const sistemas: { [key: string]: string } = {
      'round_robin': 'Round Robin',
      'suizo': 'Sistema Suizo',
      'grupos': 'Por Grupos'
    };
    
    return tipo ? sistemas[tipo] || tipo : 'Por Grupos';
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
    const nombres = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo'];

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

  obtenerDesempates(desempates: any): string[] {
    if (!desempates) return [];

    if (typeof desempates === 'string') {
      try {
        desempates = JSON.parse(desempates);
      } catch (e) {
        return [];
      }
    }

    if (Array.isArray(desempates)) {
      return desempates.map(d => this.formatearNombreDesempate(d));
    }

    return [];
  }

  private formatearNombreDesempate(nombre: string): string {
    const nombres: { [key: string]: string } = {
      'buchholz': 'Buchholz',
      'sonneborn_berger': 'Sonneborn-Berger',
      'encuentro_directo': 'Encuentro Directo',
      'progresivo': 'Progresivo',
      'koya': 'Sistema Koya'
    };

    return nombres[nombre.toLowerCase()] || nombre;
  }

  volver(): void {
    this.router.navigate(['/main-view/ligas']);
  }

  editarLiga(): void {
    if (this.ligaId) {
      this.router.navigate(['/main-view/editar-liga', this.ligaId]);
    }
  }
}
