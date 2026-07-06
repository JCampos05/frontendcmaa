import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import * as XLSX from 'xlsx';

import { EstadisticaTorneoService } from '../../../services/estadistica-torneo';
import { TorneoCategoriaService } from '../../../services/torneo-categoria';
import { InscripcionService } from '../../../services/inscripcion';

import { TorneoCategoria } from '../../../models/torneo-categoria';
import { Inscripcion } from '../../../models/inscripcion';
import { ToastNoti } from '../../modales/toast-noti/toast-noti';

interface JugadorRanking {
  idJugador: number;
  posicion: number;
  nombre: string;
  rating: number;
  puntos: number;
  desempates: { [key: string]: number };
  editando?: boolean;
}

@Component({
  selector: 'app-cargar-ranking-excel',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ToastNoti],
  templateUrl: './cargar-ranking-excel.html',
  styleUrls: ['./cargar-ranking-excel.css']
})
export class CargarRankingExcelComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  @Input() idTorneo!: number;
  @Input() idTorneoCategoria!: number;
  @Input() torneoCategoria!: TorneoCategoria;
  @Input() jugadoresInscritos: any[] = [];

  @Output() onRankingCargado = new EventEmitter<void>();
  @Output() onCancelar = new EventEmitter<void>();

  ranking: JugadorRanking[] = [];
  sistemasDesempate: string[] = [];
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';

  procesando = false;
  mostrarVistaPrevia = false;
  errores: string[] = [];

  mostrarInfo = false;

  // Map para búsqueda rápida de jugadores
  private jugadoresMap: Map<string, Inscripcion> = new Map();

  constructor(
    private estadisticaService: EstadisticaTorneoService,
    private torneoCategoriaService: TorneoCategoriaService,
    private inscripcionService: InscripcionService
  ) { }

  async ngOnInit(): Promise<void> {
    this.cargarSistemasDesempate();
    await this.cargarJugadoresCompletos();
  }

  private async cargarJugadoresCompletos(): Promise<void> {
    if (!this.idTorneo) {
      console.warn('No hay ID de torneo');
      return;
    }

    try {
      // Cargar inscripciones completas desde el backend
      const inscripciones = await this.inscripcionService.getByTorneo(this.idTorneo).toPromise();

      if (inscripciones && inscripciones.length > 0) {
        // Crear map de búsqueda por nombre normalizado
        inscripciones.forEach((insc: Inscripcion) => {
          if (insc.jugador) {
            const nombreCompleto = this.normalizarNombre(
              `${insc.jugador.nombre} ${insc.jugador.apellido1} ${insc.jugador.apellido2 || ''}`
            );
            this.jugadoresMap.set(nombreCompleto, insc);
          }
        });

        console.log(`Jugadores cargados: ${this.jugadoresMap.size}`);
      }
    } catch (error) {
      console.error('Error al cargar jugadores completos:', error);
      this.toast.error('Error', 'No se pudieron cargar los datos de los jugadores');
    }
  }

  private cargarSistemasDesempate(): void {
    if (this.torneoCategoria?.desempates && Array.isArray(this.torneoCategoria.desempates)) {
      this.sistemasDesempate = this.torneoCategoria.desempates;
      console.log('Sistemas de desempate:', this.sistemasDesempate);
      return;
    }

    if (!this.idTorneo || !this.idTorneoCategoria) {
      console.error('Faltan IDs para cargar sistemas de desempate');
      return;
    }

    this.torneoCategoriaService.getOne(this.idTorneo, this.idTorneoCategoria).subscribe({
      next: (torneoCategoria) => {
        if (torneoCategoria?.desempates && Array.isArray(torneoCategoria.desempates)) {
          this.sistemasDesempate = torneoCategoria.desempates;
          console.log('Sistemas cargados del servicio:', this.sistemasDesempate);
        } else {
          console.warn('No se encontraron sistemas de desempate');
          this.sistemasDesempate = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar sistemas de desempate:', err);
        this.sistemasDesempate = [];
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      this.nombreArchivo = file.name;

      setTimeout(() => {
        this.procesarExcel(file);
      }, 100);
    }
  }

  procesarExcel(file: File): void {
    this.procesando = true;
    this.errores = [];

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        this.extraerRanking(jsonData);

        if (this.ranking.length > 0) {
          this.mostrarVistaPrevia = true;
        }

      } catch (error) {
        console.error('Error al procesar Excel:', error);
        this.toast.error('Error', 'No se pudo procesar el archivo Excel');
      } finally {
        this.procesando = false;
      }
    };

    reader.onerror = () => {
      this.toast.error('Error', 'No se pudo leer el archivo');
      this.procesando = false;
    };

    reader.readAsArrayBuffer(file);
  }

  private extraerRanking(data: any[]): void {
    this.ranking = [];

    console.log('Iniciando extracción');
    console.log('Sistemas esperados:', this.sistemasDesempate);

    // PASO 1: Encontrar encabezados
    let filaEncabezados = -1;
    let colRank = -1, colName = -1, colRtg = -1, colPts = -1;

    for (let i = 0; i < Math.min(20, data.length); i++) {
      const fila = data[i];
      if (!Array.isArray(fila)) continue;

      const filaStr = fila.map(c => String(c || '').toLowerCase().trim());

      if (filaStr.some(c => c === 'rank' || c.includes('rank')) &&
        filaStr.some(c => c === 'name' || c.includes('name'))) {
        filaEncabezados = i;

        fila.forEach((cell: any, idx: number) => {
          const cellStr = String(cell || '').toLowerCase().trim();
          if (cellStr === 'rank' || cellStr.includes('rank')) colRank = idx;
          if (cellStr === 'name' || cellStr.includes('name')) colName = idx;
          if (cellStr === 'rtg' || cellStr.includes('rtg')) colRtg = idx;
          if (cellStr === 'pts' || cellStr.includes('pts')) colPts = idx;
        });

        break;
      }
    }

    if (filaEncabezados === -1 || colRank === -1 || colName === -1 || colPts === -1) {
      this.errores.push('No se encontraron columnas requeridas (Rank, Name, Pts)');
      this.toast.warning('Advertencia', 'Formato de Excel no válido');
      return;
    }

    console.log('Columnas encontradas: Rank=' + colRank + ', Name=' + colName + ', Rtg=' + colRtg + ', Pts=' + colPts);

    // PASO 2: Procesar filas
    for (let i = filaEncabezados + 1; i < data.length; i++) {
      const fila = data[i];
      if (!Array.isArray(fila) || fila.length === 0) continue;

      const rankStr = String(fila[colRank] || '').trim();
      const nombreExcel = String(fila[colName] || '').trim();
      const puntosStr = String(fila[colPts] || '').trim();

      if (!rankStr || !nombreExcel || !puntosStr) continue;
      if (rankStr.toLowerCase() === 'null' || nombreExcel.toLowerCase() === 'null') continue;

      const posicion = parseInt(rankStr);
      if (isNaN(posicion)) continue;

      // Buscar jugador en el map
      const inscripcion = this.buscarJugadorPorNombre(nombreExcel);
      if (!inscripcion || !inscripcion.jugador) {
        this.errores.push(`Jugador no encontrado: ${nombreExcel}`);
        continue;
      }

      const jugador = inscripcion.jugador;
      const puntos = this.parsearPuntos(puntosStr);
      const rating = colRtg !== -1 ? parseInt(String(fila[colRtg] || '0')) : jugador.rating || 0;

      // MAPEO SIMPLE DE DESEMPATES - ORDEN DE torneo_categoria
      const desempates: { [key: string]: number } = {};

      // Leer valores del Excel (columnas después de Pts)
      const valoresExcel: number[] = [];
      for (let colIdx = colPts + 1; colIdx < fila.length; colIdx++) {
        const valorStr = String(fila[colIdx] || '').trim();
        valoresExcel.push(this.parsearPuntos(valorStr));
      }

      // Asignar en el ORDEN de sistemasDesempate
      let idxExcel = 0;
      for (const sistema of this.sistemasDesempate) {
        if (sistema.toLowerCase().includes('edad')) {
          desempates[sistema] = inscripcion.edad || 0;
        } else {
          desempates[sistema] = valoresExcel[idxExcel] || 0;
          idxExcel++;
        }
      }

      console.log(`Desempates para ${nombreExcel}:`, desempates);

      this.ranking.push({
        idJugador: jugador.idJugador!,
        posicion,
        nombre: `${jugador.nombre} ${jugador.apellido1} ${jugador.apellido2 || ''}`.trim(),
        rating,
        puntos,
        desempates,
        editando: false
      });
    }

    // Ordenar por posición
    this.ranking.sort((a, b) => a.posicion - b.posicion);
    this.ranking.forEach((j, idx) => j.posicion = idx + 1);

    console.log('Ranking procesado:', this.ranking.length, 'jugadores');
    console.log('Primer jugador:', this.ranking[0]);

    if (this.errores.length > 0) {
      console.warn('Advertencias:', this.errores);
    }
  }

  private buscarJugadorPorNombre(nombreExcel: string): Inscripcion | null {
    const nombreNormalizado = this.normalizarNombre(nombreExcel);

    // Búsqueda exacta
    if (this.jugadoresMap.has(nombreNormalizado)) {
      return this.jugadoresMap.get(nombreNormalizado)!;
    }

    // Búsqueda parcial
    for (const [nombre, inscripcion] of this.jugadoresMap.entries()) {
      if (nombre.includes(nombreNormalizado) || nombreNormalizado.includes(nombre)) {
        return inscripcion;
      }
    }

    return null;
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parsearPuntos(valor: string): number {
    valor = valor.trim();

    // Reemplazar símbolos de media
    valor = valor.replace(/½/g, '.5');
    valor = valor.replace(/¼/g, '.25');
    valor = valor.replace(/¾/g, '.75');

    // Manejar fracciones como "7 1/2"
    const fraccionMatch = valor.match(/(\d+)\s*(\d+)\/(\d+)/);
    if (fraccionMatch) {
      const entero = parseInt(fraccionMatch[1]);
      const numerador = parseInt(fraccionMatch[2]);
      const denominador = parseInt(fraccionMatch[3]);
      return entero + (numerador / denominador);
    }

    // Reemplazar comas por puntos
    valor = valor.replace(',', '.');

    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
  }

  drop(event: CdkDragDrop<JugadorRanking[]>): void {
    moveItemInArray(this.ranking, event.previousIndex, event.currentIndex);

    this.ranking.forEach((jugador, index) => {
      jugador.posicion = index + 1;
    });

    console.log('Nuevo orden aplicado');
  }

  toggleEdicion(jugador: JugadorRanking): void {
    jugador.editando = !jugador.editando;
  }

  actualizarValor(jugador: JugadorRanking, campo: string, valor: any): void {
    if (campo === 'puntos' || campo === 'rating') {
      (jugador as any)[campo] = parseFloat(valor) || 0;
    }
  }

  actualizarDesempate(jugador: JugadorRanking, sistema: string, valor: any): void {
    jugador.desempates[sistema] = parseFloat(valor) || 0;
  }

  async guardarRanking(): Promise<void> {
    if (this.ranking.length === 0) {
      this.toast.warning('Advertencia', 'No hay datos para guardar');
      return;
    }

    this.procesando = true;

    try {
      const dto = {
        idTorneo: this.idTorneo,
        idTorneoCategoria: this.idTorneoCategoria,
        jugadores: this.ranking.map(j => ({
          idJugador: j.idJugador,
          posicion: j.posicion,
          puntos: j.puntos,
          rating: j.rating,
          desempates: j.desempates
        }))
      };

      await this.estadisticaService.cargarRankingFinal(dto).toPromise();

      this.toast.success('Éxito', 'Ranking cargado correctamente');
      this.onRankingCargado.emit();
      this.cerrar();

    } catch (error) {
      console.error('Error al guardar ranking:', error);
      this.toast.error('Error', 'No se pudo guardar el ranking');
    } finally {
      this.procesando = false;
    }
  }

  cerrar(): void {
    this.onCancelar.emit();
  }

  limpiar(): void {
    this.ranking = [];
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.mostrarVistaPrevia = false;
    this.errores = [];
  }

  get puedeGuardar(): boolean {
    return this.ranking.length > 0 && !this.procesando;
  }

  getSistemasExcel(): string[] {
    return this.sistemasDesempate.filter(s => !s.toLowerCase().includes('edad'));
  }

  toggleInfo(): void {
    this.mostrarInfo = !this.mostrarInfo;
  }
}
