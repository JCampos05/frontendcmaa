import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { TorneoContextService } from '../../../../services/torneo-context';
import { Torneo } from '../../../../models/torneo';
import { HoraAmPmPipe } from '../../../../pipes/hora-ampm.pipe';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';

interface DetalleNota {
  titulo: string;
  texto: string;
  icono: string;
}

@Component({
  selector: 'app-torneo-actual',
  standalone: true,
  imports: [
    CommonModule, HoraAmPmPipe, PageHeaderComponent, StateMessageComponent,
    EmptyStateComponent, ButtonComponent, IconComponent, SelectComponent
  ],
  templateUrl: './torneo-actual.html',
  styleUrls: ['./torneo-actual.css']
})
export class TorneoActualComponent implements OnInit {
  torneos: Torneo[] = [];
  torneoActual: Torneo | null = null;
  torneoOptions: SelectOption<Torneo>[] = [];
  cargando = false;
  error: string | null = null;

  constructor(
    private torneoService: TorneoService,
    private authService: AuthService,
    private torneoContext: TorneoContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTorneoActual();
  }

  cargarTorneoActual(): void {
    this.cargando = true;
    this.error = null;

    // Para adminTorneo lo relevante es la ASIGNACIÓN (ya acotada server-side),
    // no si el torneo además está marcado activo — filtrar por activo=true
    // dejaba a un adminTorneo con un torneo asignado pero no activado varado
    // en "sin torneo asignado". adminGral sí sigue viendo solo activos, ya
    // que para ese rol esta pantalla muestra el torneo activo a gestionar,
    // no una asignación personal.
    const esAdminTorneo = this.authService.currentUserValue?.rol === 'adminTorneo';
    this.torneoService.getAll(esAdminTorneo ? undefined : true).subscribe({
      next: (torneos) => {
        if ((!torneos || torneos.length === 0) && this.authService.currentUserValue?.rol === 'adminTorneo') {
          this.router.navigate(['/main-view/sin-torneo-asignado']);
          return;
        }

        if (torneos && torneos.length > 0) {
          const torneosOrdenados = torneos.sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });
          this.torneos = torneosOrdenados;
          this.torneoOptions = torneosOrdenados.map(t => ({ value: t, label: `${t.nombre} - ${this.formatearFecha(t.fecha)}` }));

          // Si ya hay un torneo elegido en el contexto compartido (p.ej. el
          // admin lo seleccionó aquí o en Inscripciones/Mesas/etc.) y sigue
          // estando entre los suyos, respetar esa elección en vez de volver
          // a auto-elegir el más próximo.
          const seleccionActual = this.torneoContext.torneoSeleccionadoValue;
          const seleccionVigente = seleccionActual
            ? torneosOrdenados.find(t => t.idTorneo === seleccionActual.idTorneo)
            : undefined;

          if (seleccionVigente) {
            this.torneoActual = seleccionVigente;
          } else {
            const hoy = new Date();
            const tresDiasDespues = new Date();
            tresDiasDespues.setDate(hoy.getDate() + 3);

            const torneoEnRango = torneosOrdenados.find(t => {
              const fechaTorneo = new Date(t.fecha);
              return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
            });

            this.torneoActual = torneoEnRango || torneosOrdenados[0];
          }

          this.torneoContext.seleccionar(this.torneoActual);
        } else {
          this.torneos = [];
          this.torneoOptions = [];
          this.torneoActual = null;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el torneo actual';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onTorneoSeleccionadoChange(torneo: Torneo): void {
    this.torneoActual = torneo;
    this.torneoContext.seleccionar(torneo);
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    
    // Extraer componentes de la fecha para evitar problemas de zona horaria
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  obtenerEstadoTorneo(): string {
    if (!this.torneoActual) return '';

    // Crear fecha en zona horaria local para evitar desfases
    const fechaStr = typeof this.torneoActual.fecha === 'string' 
      ? this.torneoActual.fecha 
      : this.torneoActual.fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const fechaTorneo = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaTorneo.setHours(0, 0, 0, 0);

    const diferenciaDias = Math.floor((fechaTorneo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) return 'Finalizado';
    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias <= 3) return `En ${diferenciaDias} día${diferenciaDias > 1 ? 's' : ''}`;
    return 'Próximamente';
  }

  obtenerClaseEstado(): string {
    const estado = this.obtenerEstadoTorneo();
    if (estado === 'Hoy') return 'estado-hoy';
    if (estado.includes('día')) return 'estado-proximo';
    if (estado === 'Próximamente') return 'estado-futuro';
    return 'estado-finalizado';
  }

  getCategorias(): string[] {
    if (!this.torneoActual?.torneoCategorias) return [];
    try {
      const cats = typeof this.torneoActual.torneoCategorias === 'string'
        ? JSON.parse(this.torneoActual.torneoCategorias)
        : this.torneoActual.torneoCategorias;
      return Array.isArray(cats) ? cats : [];
    } catch {
      return [];
    }
  }

  getCategoriasDetalladas(): any[] {
    // Intentar con diferentes nombres de la relación
    const torneoCategoria = this.torneoActual?.torneoCategorias
      || (this.torneoActual as any)?.torneo_categorias
      || (this.torneoActual as any)?.TorneoCategorias
      || [];

    if (!torneoCategoria || torneoCategoria.length === 0) {
      return [];
    }
    
    
    const categorias = torneoCategoria.map((tc: any) => {
      return {
        nombre: tc.categoria?.nombre || 'Sin categoría',
        ritmoJuego: tc.ritmoJuego || tc.ritmo_juego || 'No especificado',
        sistemaCompetencia: tc.sistemaCompetencia || tc.sistema_competencia || 'No especificado',
        costo: tc.categoria?.costo || 0
      };
    });
    
    return categorias;
  }

  getRitmoJuego(): string {
    if (!this.torneoActual?.torneoCategorias || this.torneoActual.torneoCategorias.length === 0) {
      return '';
    }
    const ritmos = this.torneoActual.torneoCategorias
      .map((tc: any) => tc.ritmoJuego)
      .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i);
    return ritmos.length > 0 ? ritmos.join(', ') : '';
  }

  getSistemaCompetencia(): string {
    if (!this.torneoActual?.torneoCategorias || this.torneoActual.torneoCategorias.length === 0) {
      return '';
    }
    const sistemas = this.torneoActual.torneoCategorias
      .map((tc: any) => tc.sistemaCompetencia)
      .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i);
    return sistemas.length > 0 ? sistemas.join(', ') : '';
  }

  navegarListas(): void {
    this.router.navigate(['/main-view/listas']);
  }

  navegarMesas(): void {
    this.router.navigate(['/main-view/mesas-torneo']);
  }

  navegarResultados(): void {
    this.router.navigate(['/main-view/resultados-torneo']);
  }

  navegarInscripciones(): void {
    this.router.navigate(['/main-view/inscripciones-torneo']);
  }

  navegarNuevoTorneo(): void {
    this.router.navigate(['/main-view/nuevo-torneo']);
  }

  getDetallesNotas(): DetalleNota[] {
    if (!this.torneoActual?.notas) return [];

    const notas = this.torneoActual.notas.trim();
    const detalles: DetalleNota[] = [];

    // Configuración de patrones con palabras clave
    const configuraciones = [
      { 
        keywords: ['premio', 'premios'], 
        titulo: 'Premios', 
        icono: 'fa-solid fa-trophy' 
      },
      { 
        keywords: ['inscripción', 'inscripcion'], 
        titulo: 'Inscripción', 
        icono: 'fa-solid fa-pen-to-square' 
      },
      { 
        keywords: ['costo', 'precio'], 
        titulo: 'Costo', 
        icono: 'fa-solid fa-dollar-sign' 
      },
      { 
        keywords: ['requisito', 'requisitos'], 
        titulo: 'Requisitos', 
        icono: 'fa-solid fa-clipboard-check' 
      },
      { 
        keywords: ['contacto', 'información', 'informacion'], 
        titulo: 'Contacto', 
        icono: 'fa-solid fa-address-book' 
      },
      { 
        keywords: ['desempate', 'desempates'], 
        titulo: 'Sistema de Desempate', 
        icono: 'fa-solid fa-scale-balanced' 
      },
      { 
        keywords: ['organizador', 'organizadores', 'organiza'], 
        titulo: 'Organización', 
        icono: 'fa-solid fa-user-tie' 
      },
      { 
        keywords: ['árbitro', 'arbitro', 'árbitros', 'arbitros'], 
        titulo: 'Árbitro Principal', 
        icono: 'fa-solid fa-gavel' 
      },
      { 
        keywords: ['restricción', 'restriccion', 'restricciones'], 
        titulo: 'Restricciones', 
        icono: 'fa-solid fa-ban' 
      },
      { 
        keywords: ['observación', 'observacion', 'observaciones'], 
        titulo: 'Observaciones', 
        icono: 'fa-solid fa-eye' 
      },
      { 
        keywords: ['norma', 'normas', 'reglamento'], 
        titulo: 'Normas', 
        icono: 'fa-solid fa-book' 
      },
      { 
        keywords: ['participante', 'participantes'], 
        titulo: 'Participantes', 
        icono: 'fa-solid fa-users' 
      },
      { 
        keywords: ['horario', 'horarios'], 
        titulo: 'Horarios', 
        icono: 'fa-solid fa-clock' 
      },
      { 
        keywords: ['material', 'materiales'], 
        titulo: 'Material Requerido', 
        icono: 'fa-solid fa-chess' 
      },
      { 
        keywords: ['equipo', 'equipos'], 
        titulo: 'Equipos', 
        icono: 'fa-solid fa-people-group' 
      },
      { 
        keywords: ['regla', 'reglas'], 
        titulo: 'Reglas', 
        icono: 'fa-solid fa-list-check' 
      },
      { 
        keywords: ['importante'], 
        titulo: 'Importante', 
        icono: 'fa-solid fa-circle-exclamation' 
      },
      { 
        keywords: ['nota', 'notas'], 
        titulo: 'Notas Adicionales', 
        icono: 'fa-solid fa-note-sticky' 
      }
    ];

    // Dividir por líneas
    const lineas = notas.split('\n').filter(l => l.trim());
    
    let i = 0;
    while (i < lineas.length) {
      const linea = lineas[i].trim();
      let encontrado = false;

      // Buscar si la línea contiene alguna palabra clave
      for (const config of configuraciones) {
        const linealower = linea.toLowerCase();
        const tieneKeyword = config.keywords.some(kw => linealower.includes(kw));
        
        if (tieneKeyword && linea.includes(':')) {
          // Extraer el contenido después de los dos puntos
          const partes = linea.split(':');
          let contenido = partes.slice(1).join(':').trim();
          
          // Agregar líneas siguientes que no sean nuevas secciones
          let j = i + 1;
          while (j < lineas.length) {
            const siguienteLinea = lineas[j].trim();
            const esNuevaSeccion = configuraciones.some(c => 
              c.keywords.some(kw => siguienteLinea.toLowerCase().includes(kw)) && 
              siguienteLinea.includes(':')
            );
            
            if (esNuevaSeccion) break;
            
            contenido += '\n' + siguienteLinea;
            j++;
          }
          
          if (contenido) {
            detalles.push({
              titulo: config.titulo,
              texto: contenido.trim(),
              icono: config.icono
            });
          }
          
          i = j;
          encontrado = true;
          break;
        }
      }
      
      if (!encontrado) i++;
    }

    // Si no se encontró ninguna sección estructurada, mostrar todo como información general
    if (detalles.length === 0) {
      detalles.push({
        titulo: 'Información General',
        texto: notas,
        icono: 'fa-solid fa-info-circle'
      });
    }

    return detalles;
  }
}
