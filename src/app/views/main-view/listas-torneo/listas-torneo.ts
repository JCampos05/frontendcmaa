import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

import { TorneoService } from '../../../services/torneo/torneo';
import { InscripcionService } from '../../../services/inscripcion/inscripcion';
import { JugadorService } from '../../../services/jugador/jugador';
import { Torneo } from '../../../models/torneo';
import { Inscripcion } from '../../../models/inscripcion';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';


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
  imports: [CommonModule, FormsModule, ToastNoti, ModalConfirmacionComponent],
  templateUrl: './listas-torneo.html',
  styleUrls: ['./listas-torneo.css']
})
export class ListasTorneoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneoSeleccionado: Torneo | null = null;
  inscripciones: Inscripcion[] = [];
  datosFenamac: DatosFenamac[] = [];
  estadisticasPorCategoria: EstadisticasCategoria[] = [];
  categoriaSeleccionada: number | null = null;

  cargando = false;
  procesando = false;
  archivoSeleccionado = false;
  error: string | null = null;

  mostrarModalConfirmacion = false;

  constructor(
    private torneoService: TorneoService,
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

    this.torneoService.getActivos().subscribe({
      next: (torneos) => {
        if (torneos && torneos.length > 0) {
          const torneosOrdenados = torneos.sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });

          const hoy = new Date();
          const tresDiasDespues = new Date();
          tresDiasDespues.setDate(hoy.getDate() + 3);

          const torneoEnRango = torneosOrdenados.find(t => {
            const fechaTorneo = new Date(t.fecha);
            return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
          });

          this.torneoSeleccionado = torneoEnRango || torneosOrdenados[0];

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.error = 'No hay torneos activos';
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
        nombreCompleto: `${insc.jugador?.nombre || ''} ${insc.jugador?.apellido1 || ''} ${insc.jugador?.apellido2 || ''}`.trim(),
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
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExtensions = ['.xls', '.xlsx'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      this.toast.error('Error','Por favor selecciona un archivo Excel válido (.xls o .xlsx)');
      //alert('Por favor selecciona un archivo Excel válido (.xls o .xlsx)');
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

        //console.log('Archivo cargado exitosamente:', this.datosFenamac.length, 'registros');
        this.toast.success('Archivo procesado',`Archivo cargado: ${this.datosFenamac.length} jugadores encontrados`);
        //alert(`Archivo cargado: ${this.datosFenamac.length} jugadores encontrados`);
      } catch (error) {
        console.error('Error','Error al procesar el archivo:', error);
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
        const jugadorFenamac = this.buscarJugadorFenamac(jugador.apellido1, jugador.apellido2);

        const nuevoRating = jugadorFenamac?.Rtg_Nat || 0;
        jugador.rating = nuevoRating;
        jugador.encontrado = !!jugadorFenamac;

        if (jugador.idJugador > 0) {
          const promesa = this.jugadorService.update(jugador.idJugador, { rating: nuevoRating })
            .toPromise()
            .then(() => {
              if (jugadorFenamac) {
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

      this.toast.success(
        'Actualización completada',
        `Actualizados: ${actualizados} | No encontrados: ${noEncontrados} | Errores: ${errores}`
      );

      console.log('Actualización completada:', { actualizados, noEncontrados, errores });
    });
  }

  cancelarActualizacion(): void {
    this.mostrarModalConfirmacion = false;
  }

  buscarJugadorFenamac(apellido1: string, apellido2: string): DatosFenamac | null {
    if (!this.datosFenamac || this.datosFenamac.length === 0) return null;

    const buscarPorApellidos = (ap1: string, ap2: string): DatosFenamac | undefined => {
      return this.datosFenamac.find(jugador => {
        const nombreCompleto = (jugador.Name || '').toLowerCase();
        const palabras = nombreCompleto.split(/\s+/);

        if (palabras.length < 2) return false;

        const primerApellido = palabras[0];
        const segundoApellido = palabras[1];

        if (primerApellido === ap1) {
          if (!ap2) return true;
          return segundoApellido === ap2;
        }

        return false;
      });
    };

    let resultado = buscarPorApellidos(apellido1, apellido2);

    if (!resultado && apellido2) {
      resultado = buscarPorApellidos(apellido1, '');
    }

    return resultado || null;
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionada = idCategoria;
  }

  getJugadoresFiltrados(): JugadorConRating[] {
    if (this.categoriaSeleccionada === null) {
      return this.estadisticasPorCategoria.flatMap(c => c.jugadores);
    }

    const cat = this.estadisticasPorCategoria.find(c => c.idCategoria === this.categoriaSeleccionada);
    return cat?.jugadores || [];
  }

  exportarExcel(): void {
    const wb = XLSX.utils.book_new();

    this.estadisticasPorCategoria.forEach(cat => {
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
        { wch: 5 },   // NO
        { wch: 8 },   // TITLE
        { wch: 35 },  // NAME
        { wch: 5 },   // SEX
        { wch: 6 },   // FED
        { wch: 12 }   // Nat. Rating
      ];

      const nombreHoja = cat.nombreCategoria.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    });

    const nombreArchivo = `SwissManager_${this.torneoSeleccionado?.nombre || 'torneo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    this.toast.success('Archivo creado','Archivo Excel creado correctamente');
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
}