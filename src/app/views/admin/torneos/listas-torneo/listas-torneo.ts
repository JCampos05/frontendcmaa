import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { TorneoContextService } from '../../../../services/torneo-context';
import { InscripcionService } from '../../../../services/inscripcion';
import { JugadorService } from '../../../../services/jugador';
import { Torneo } from '../../../../models/torneo';
import { Inscripcion } from '../../../../models/inscripcion';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { FilterChipsComponent, FilterChipOption } from '../../../../componentes/molecules/filter-chips/filter-chips';
import { DataTableComponent, DataTableColumn } from '../../../../componentes/organisms/data-table/data-table';
import { BadgeComponent, BadgeStatus } from '../../../../componentes/atoms/badge/badge';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { AvisoTorneoSeleccionadoComponent } from '../../../../componentes/molecules/aviso-torneo-seleccionado/aviso-torneo-seleccionado';


interface DatosFenamac {
  ID_No: number;
  Fide_No: string;
  Name: string;
  Fed: string;
  Clubnumb: string;
  ClubName: string;
  Birthday: string;
  Rtg_Nat: number;
  Rtg_Int: number;
  Title: string;
  K: number;
}

interface JugadorConRating {
  idJugador: number;
  nombreCompleto: string;
  apellido1: string;
  apellido2: string;
  nombre: string;
  telefono: string;
  rating: number;
  ratingAnterior: number;
  categoria: string;
  encontrado: boolean;
  idInscripcion?: number;
  estadoInscripcion?: string;
  nombreEncontradoFEN?: string;
  scoreCoincidencia?: number;
}

interface EstadisticasCategoria {
  idCategoria: number;
  nombreCategoria: string;
  totalJugadores: number;
  jugadores: JugadorConRating[];
}

@Component({
  selector: 'app-listas-torneo',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToastNoti, ModalConfirmacionComponent,
    PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent, IconComponent,
    FilterChipsComponent, DataTableComponent, BadgeComponent, StatCardGridComponent, AvisoTorneoSeleccionadoComponent
  ],
  templateUrl: './listas-torneo.html',
  styleUrls: ['./listas-torneo.css']
})
export class ListasTorneoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneoSeleccionado: Torneo | null = null;
  // Solo para saber si mostrar el aviso "cambia de torneo en Torneo Actual"
  // (no tiene sentido si el admin únicamente tiene uno asignado).
  totalTorneosAsignados = 0;
  inscripciones: Inscripcion[] = [];
  datosFenamac: DatosFenamac[] = [];
  estadisticasPorCategoria: EstadisticasCategoria[] = [];
  categoriaSeleccionada: number | null = null;

  cargando = false;
  procesando = false;
  archivoSeleccionado = false;
  error: string | null = null;
  sinDatos: string | null = null;

  mostrarModalConfirmacion = false;
  mostrarDetalleCoincidencias = false;

  constructor(
    private torneoService: TorneoService,
    private authService: AuthService,
    private torneoContext: TorneoContextService,
    private inscripcionService: InscripcionService,
    private jugadorService: JugadorService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.cargarTorneoActual();
  }

  cargarTorneoActual(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    // adminTorneo: la asignación ya acota server-side, no hay que filtrar
    // además por activo (un torneo asignado pero finalizado/inactivo sigue
    // siendo válido para consultar sus listas).
    const esAdminTorneo = this.authService.currentUserValue?.rol === 'adminTorneo';
    this.torneoService.getAll(esAdminTorneo ? undefined : true).subscribe({
      next: (torneos) => {
        this.totalTorneosAsignados = torneos?.length || 0;
        if (torneos && torneos.length > 0) {
          const torneosOrdenados = torneos.sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });

          // Respetar el torneo elegido en el contexto compartido (p.ej. desde
          // "Torneo Actual" u otra vista hermana) si sigue entre los propios.
          const seleccionActual = this.torneoContext.torneoSeleccionadoValue;
          const seleccionVigente = seleccionActual
            ? torneosOrdenados.find(t => t.idTorneo === seleccionActual.idTorneo)
            : undefined;

          if (seleccionVigente) {
            this.torneoSeleccionado = seleccionVigente;
          } else {
            const hoy = new Date();
            const tresDiasDespues = new Date();
            tresDiasDespues.setDate(hoy.getDate() + 3);

            const torneoEnRango = torneosOrdenados.find(t => {
              const fechaTorneo = new Date(t.fecha);
              return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
            });

            this.torneoSeleccionado = torneoEnRango || torneosOrdenados[0];
          }

          this.torneoContext.seleccionar(this.torneoSeleccionado);

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.sinDatos = 'No hay torneos activos';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar el torneo actual';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarInscripciones(idTorneo: number): void {
    this.inscripcionService.getByTorneo(idTorneo).subscribe({
      next: (inscripciones) => {
        this.inscripciones = inscripciones;
        this.procesarListas();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar inscripciones';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  procesarListas(): void {
    const categorias = new Map<number, EstadisticasCategoria>();

    this.inscripciones.forEach(insc => {
      const idCat = insc.idCategoria || 0;

      if (!categorias.has(idCat)) {
        categorias.set(idCat, {
          idCategoria: idCat,
          nombreCategoria: insc.categoria?.nombre || 'Sin categoría',
          totalJugadores: 0,
          jugadores: []
        });
      }

      const cat = categorias.get(idCat)!;

      const jugador: JugadorConRating = {
        idJugador: insc.jugador?.idJugador || 0,
        nombreCompleto: `${insc.jugador?.apellido1 || ''} ${insc.jugador?.apellido2 || ''} ${insc.jugador?.nombre || ''} `.trim(),
        apellido1: (insc.jugador?.apellido1 || '').toLowerCase(),
        apellido2: (insc.jugador?.apellido2 || '').toLowerCase(),
        nombre: insc.jugador?.nombre || '',
        telefono: insc.jugador?.telefono || '',
        rating: insc.jugador?.rating || 0,
        ratingAnterior: insc.jugador?.rating || 0,
        categoria: cat.nombreCategoria,
        encontrado: false,
        idInscripcion: insc.idInscripcion,
        estadoInscripcion: insc.estado || 'pendiente'
      };

      cat.jugadores.push(jugador);
      cat.totalJugadores++;
    });

    categorias.forEach(cat => {
      cat.jugadores.sort((a, b) => {
        if (a.apellido1 !== b.apellido1) {
          return a.apellido1.localeCompare(b.apellido1);
        }
        return a.apellido2.localeCompare(b.apellido2);
      });
    });

    this.estadisticasPorCategoria = Array.from(categorias.values());
    this.actualizarDerivados();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExtensions = ['.xls', '.xlsx'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      this.toast.error('Error', 'Por favor selecciona un archivo Excel válido (.xls o .xlsx)');
      event.target.value = '';
      return;
    }

    this.procesando = true;
    this.error = null;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        this.datosFenamac = jsonData.map((row: any) => ({
          ID_No: row['ID_No'] || row['ID No'] || 0,
          Fide_No: row['Fide_No'] || row['Fide No'] || '',
          Name: row['Name'] || '',
          Fed: row['Fed'] || '',
          Clubnumb: row['Clubnumb'] || '',
          ClubName: row['ClubName'] || row['ClubName'] || '',
          Birthday: row['Birthday'] || '',
          Rtg_Nat: parseInt(row['Rtg_Nat'] || row['Rtg Nat'] || '0'),
          Rtg_Int: parseInt(row['Rtg_Int'] || row['Rtg Int'] || '0'),
          Title: row['Title'] || '',
          K: parseInt(row['K'] || '0')
        }));

        this.archivoSeleccionado = true;
        this.procesando = false;

        // Calcular coincidencias inmediatamente después de cargar el archivo
        this.calcularCoincidencias();
        this.actualizarDerivados();

        this.toast.success('Archivo procesado', `Archivo cargado: ${this.datosFenamac.length} jugadores encontrados`);
      } catch (error) {
        console.error('Error', 'Error al procesar el archivo:', error);
        this.error = 'Error al procesar el archivo Excel';
        this.procesando = false;
      }
    };

    reader.onerror = () => {
      this.error = 'Error al leer el archivo';
      this.procesando = false;
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  actualizarRatings(): void {
    if (!this.archivoSeleccionado || this.datosFenamac.length === 0) {
      this.toast.warning(
        'Archivo no cargado',
        'Primero debes cargar el archivo Excel con los datos de FENAMAC'
      );
      return;
    }

    this.mostrarModalConfirmacion = true;
  }

  confirmarActualizacion(): void {
    this.mostrarModalConfirmacion = false;
    this.procesando = true;

    let actualizados = 0;
    let noEncontrados = 0;
    let errores = 0;
    const totalJugadores = this.estadisticasPorCategoria.reduce((sum, cat) => sum + cat.jugadores.length, 0);

    const promesas: Promise<any>[] = [];

    this.estadisticasPorCategoria.forEach(cat => {
      cat.jugadores.forEach(jugador => {
        const resultadoBusqueda = this.buscarJugadorFenamac(
          jugador.apellido1, 
          jugador.apellido2,
          jugador.nombre
        );

        const nuevoRating = resultadoBusqueda?.jugador.Rtg_Nat || 0;
        jugador.rating = nuevoRating;
        jugador.encontrado = !!resultadoBusqueda;
        
        if (resultadoBusqueda) {
          jugador.nombreEncontradoFEN = resultadoBusqueda.jugador.Name;
          jugador.scoreCoincidencia = resultadoBusqueda.score;
        }

        if (jugador.idJugador > 0) {
          const promesa = this.jugadorService.update(jugador.idJugador, { rating: nuevoRating })
            .toPromise()
            .then(() => {
              if (resultadoBusqueda) {
                actualizados++;
              } else {
                noEncontrados++;
              }
            })
            .catch(err => {
              console.error(`Error al actualizar jugador ${jugador.idJugador}:`, err);
              errores++;
            });

          promesas.push(promesa);
        }
      });
    });

    Promise.all(promesas).then(() => {
      this.procesando = false;
      this.actualizarDerivados();

      this.toast.success(
        'Actualización completada',
        `Actualizados: ${actualizados} | No encontrados: ${noEncontrados} | Errores: ${errores}`
      );

    });
  }

  cancelarActualizacion(): void {
    this.mostrarModalConfirmacion = false;
  }

  private calcularCoincidencias(): void {
    this.estadisticasPorCategoria.forEach(cat => {
      cat.jugadores.forEach(jugador => {
        const resultadoBusqueda = this.buscarJugadorFenamac(
          jugador.apellido1,
          jugador.apellido2,
          jugador.nombre
        );

        if (resultadoBusqueda) {
          jugador.encontrado = true;
          jugador.nombreEncontradoFEN = resultadoBusqueda.jugador.Name;
          jugador.scoreCoincidencia = resultadoBusqueda.score;
        } else {
          jugador.encontrado = false;
          jugador.nombreEncontradoFEN = undefined;
          jugador.scoreCoincidencia = undefined;
        }
      });
    });
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private calcularSimilitud(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    if (longer.startsWith(shorter) || shorter.startsWith(longer)) {
      return shorter.length / longer.length;
    }
    
    return 0;
  }

  buscarJugadorFenamac(apellido1: string, apellido2: string, nombre: string): { jugador: DatosFenamac; score: number } | null {
    if (!this.datosFenamac || this.datosFenamac.length === 0) return null;

    const ap1Norm = this.normalizarTexto(apellido1);
    const ap2Norm = apellido2 ? this.normalizarTexto(apellido2) : '';
    const nombreNorm = this.normalizarTexto(nombre);

    let mejorCoincidencia: { jugador: DatosFenamac; score: number } | null = null;

    for (const jugadorFEN of this.datosFenamac) {
      const nombreCompleto = this.normalizarTexto(jugadorFEN.Name || '');
      const palabras = nombreCompleto.split(/\s+/).filter(p => p.length > 0);

      if (palabras.length < 2) continue;

      let score = 0;

      // Escenario 1: Formato "Apellido1 Apellido2 Nombre(s)"
      if (palabras.length >= 2) {
        const ap1FEN = palabras[0];
        const ap2FEN = palabras.length > 2 ? palabras[1] : '';
        const nombresFEN = palabras.length > 2 ? palabras.slice(2) : palabras.slice(1);

        // Verificar primer apellido (crítico)
        if (ap1FEN === ap1Norm) {
          score += 40;

          // Verificar segundo apellido si existe
          if (ap2Norm) {
            if (ap2FEN === ap2Norm) {
              score += 30;
            } else {
              const similitud = this.calcularSimilitud(ap2FEN, ap2Norm);
              if (similitud > 0.7) {
                score += 15;
              }
            }
          } else {
            // Si no hay segundo apellido en nuestro sistema, damos puntos base
            score += 15;
          }

          // Verificar nombre
          const nombreEncontrado = nombresFEN.some(n => {
            if (n === nombreNorm) return true;
            if (n.startsWith(nombreNorm) || nombreNorm.startsWith(n)) return true;
            return this.calcularSimilitud(n, nombreNorm) > 0.8;
          });

          if (nombreEncontrado) {
            score += 30;
          }
        }
      }

      // Escenario 2: Variaciones en el orden o estructura
      const coincideAp1 = palabras.some(p => p === ap1Norm || this.calcularSimilitud(p, ap1Norm) > 0.9);
      const coincideNombre = palabras.some(p => p === nombreNorm || this.calcularSimilitud(p, nombreNorm) > 0.9);
      
      if (coincideAp1 && score === 0) {
        score += 25;
        if (coincideNombre) score += 25;
        if (ap2Norm && palabras.some(p => p === ap2Norm)) score += 25;
      }

      // Actualizar mejor coincidencia
      if (score > 0 && (!mejorCoincidencia || score > mejorCoincidencia.score)) {
        mejorCoincidencia = { jugador: jugadorFEN, score };
      }
    }

    // Umbral mínimo de confianza: 70 puntos (coincidencia de apellido1 + nombre o apellido2)
    if (mejorCoincidencia && mejorCoincidencia.score >= 70) {
      return mejorCoincidencia;
    }

    return null;
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionada = idCategoria;
    this.actualizarDerivados();
  }

  jugadoresFiltrados: JugadorConRating[] = [];

  private calcularJugadoresFiltrados(): JugadorConRating[] {
    if (this.categoriaSeleccionada === null) {
      return this.estadisticasPorCategoria.flatMap(c => c.jugadores);
    }

    const cat = this.estadisticasPorCategoria.find(c => c.idCategoria === this.categoriaSeleccionada);
    return cat?.jugadores || [];
  }

  toggleDetalleCoincidencias(): void {
    this.mostrarDetalleCoincidencias = !this.mostrarDetalleCoincidencias;
    this.actualizarDerivados();
  }

  exportarExcel(): void {
    const wb = XLSX.utils.book_new();

    const categoriasAExportar = this.categoriaSeleccionada === null
      ? this.estadisticasPorCategoria
      : this.estadisticasPorCategoria.filter(cat => cat.idCategoria === this.categoriaSeleccionada);

    categoriasAExportar.forEach(cat => {
      const datos = cat.jugadores.map((jugador, index) => ({
        'NO': index + 1,
        'TITLE': '',
        'NAME': jugador.nombreCompleto,
        'SEX': '',
        'FED': 'MEX',
        'Rating nat': jugador.rating
      }));

      const ws = XLSX.utils.json_to_sheet(datos);

      ws['!cols'] = [
        { wch: 5 },
        { wch: 8 },
        { wch: 35 },
        { wch: 5 },
        { wch: 6 },
        { wch: 12 }
      ];

      const nombreHoja = cat.nombreCategoria.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    });

    const nombreCategoria = this.categoriaSeleccionada === null
      ? 'Todas_Categorias'
      : categoriasAExportar[0]?.nombreCategoria.replace(/\s+/g, '_') || 'Categoria';

    const nombreArchivo = `SwissManager_${this.torneoSeleccionado?.nombre || 'torneo'}_${nombreCategoria}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    this.toast.success('Archivo creado', 'Archivo Excel creado correctamente');
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

  getTotalJugadores(): number {
    return this.estadisticasPorCategoria.reduce((sum, cat) => sum + cat.totalJugadores, 0);
  }

  getJugadoresEncontrados(): number {
    return this.estadisticasPorCategoria.reduce((sum, cat) => {
      return sum + cat.jugadores.filter(j => j.encontrado).length;
    }, 0);
  }

  getJugadoresNoEncontrados(): number {
    return this.estadisticasPorCategoria.reduce((sum, cat) => {
      return sum + cat.jugadores.filter(j => !j.encontrado).length;
    }, 0);
  }

  categoriaFilterOptions: FilterChipOption[] = [];
  categoriaFilterActive = 'todas';
  columnasTabla: DataTableColumn[] = [];
  resumenStats: StatCardInput[] = [];

  private actualizarDerivados(): void {
    this.categoriaFilterOptions = [
      { value: 'todas', label: 'Todas las Categorías', icon: 'stack', count: this.getTotalJugadores() },
      ...this.estadisticasPorCategoria.map(cat => ({
        value: String(cat.idCategoria),
        label: cat.nombreCategoria,
        icon: 'grid-four',
        count: cat.totalJugadores
      }))
    ];

    this.categoriaFilterActive = this.categoriaSeleccionada === null ? 'todas' : String(this.categoriaSeleccionada);

    const columnas: DataTableColumn[] = [
      { key: 'numero', label: '#' },
      { key: 'nombre', label: 'Nombre Completo', icon: 'user' },
      { key: 'telefono', label: 'Teléfono', icon: 'phone' }
    ];
    if (this.categoriaSeleccionada === null) {
      columnas.push({ key: 'categoria', label: 'Categoría', icon: 'stack' });
    }
    columnas.push({ key: 'rating', label: 'Rating', icon: 'star' });
    if (this.mostrarDetalleCoincidencias && this.archivoSeleccionado) {
      columnas.push({ key: 'fenamac', label: 'Detalle FENAMAC', icon: 'file-text' });
    }
    columnas.push({ key: 'estado', label: 'Estado', icon: 'check-circle' });
    this.columnasTabla = columnas;

    this.resumenStats = [
      { icon: 'check-circle', variant: 'success', label: 'Encontrados en FENAMAC', value: this.getJugadoresEncontrados() },
      { icon: 'warning', variant: 'warning', label: 'No encontrados (Rating = 0)', value: this.getJugadoresNoEncontrados() },
      { icon: 'users', variant: 'info', label: 'Total Jugadores', value: this.getTotalJugadores() }
    ];

    this.jugadoresFiltrados = this.calcularJugadoresFiltrados();
  }

  onCategoriaFilterChange(value: string): void {
    this.seleccionarCategoria(value === 'todas' ? null : Number(value));
  }

  getEstadoBadgeStatus(estado?: string): BadgeStatus {
    if (estado === 'confirmado') return 'confirmed';
    if (estado === 'cancelado') return 'cancelled';
    return 'pending';
  }
}
