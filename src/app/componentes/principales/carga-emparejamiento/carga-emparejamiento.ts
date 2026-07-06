import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

import { MesaService } from '../../../services/mesa';
import { JugadorService } from '../../../services/jugador';
import { InscripcionService } from '../../../services/inscripcion';
import { ModalConfirmacionComponent } from '../../modales/modal-confirmacion/modal-confirmacion';
import { CreateMesaDto } from '../../../models/mesa';
import { Jugador } from '../../../models/jugador';

interface EmparejamientoExcel {
  numeroMesa: number;
  nombreBlancoCompleto: string;
  nombreNegroCompleto: string;
  idJugadorBlanco?: number;
  idJugadorNegro?: number;
  blancoEncontrado: boolean;
  negroEncontrado: boolean;
}

@Component({
  selector: 'app-modal-carga-emparejamiento',
  standalone: true,
  imports: [CommonModule, ModalConfirmacionComponent],
  templateUrl: './carga-emparejamiento.html',
  styleUrls: ['./carga-emparejamiento.css']
})
export class ModalCargaEmparejamientoComponent {
  @Input() visible = false;
  @Input() idRonda?: number;
  @Input() numeroRonda?: number;
  @Input() idTorneo?: number;
  @Input() idCategoria?: number;

  @Output() cerrar = new EventEmitter<void>();
  @Output() cargaExitosa = new EventEmitter<void>();

  archivo: File | null = null;
  emparejamientos: EmparejamientoExcel[] = [];
  todosJugadores: Jugador[] = [];
  jugadoresInscritos: any[] = [];

  cargando = false;
  procesando = false;
  guardando = false;

  errorCarga = '';
  archivoValido = false;
  vistaPreviaActiva = false;

  // Modal de confirmación
  modalConfirmacionVisible = false;
  confirmacionTitulo = '';
  confirmacionMensaje = '';
  confirmacionTextoConfirmar = '';

  constructor(
    private mesaService: MesaService,
    private jugadorService: JugadorService,
    private inscripcionService: InscripcionService
  ) { }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.validarTipoArchivo(file)) {
      this.errorCarga = 'El archivo debe ser formato Excel (.xlsx o .xls)';
      return;
    }

    this.archivo = file;
    this.procesarArchivo();
  }

  validarTipoArchivo(file: File): boolean {
    const tiposValidos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return tiposValidos.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');
  }

  procesarArchivo(): void {
    if (!this.archivo) return;

    this.procesando = true;
    this.errorCarga = '';
    this.emparejamientos = [];

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        this.parsearDatos(jsonData);
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        this.errorCarga = 'Error al leer el archivo Excel';
        this.procesando = false;
      }
    };

    reader.onerror = () => {
      this.errorCarga = 'Error al cargar el archivo';
      this.procesando = false;
    };

    reader.readAsArrayBuffer(this.archivo);
  }

  parsearDatos(jsonData: any[]): void {
    const emparejamientosTemp: EmparejamientoExcel[] = [];
    let rondaEncontrada = false;

    // Construir el texto de búsqueda según el número de ronda
    const textoBusqueda = this.numeroRonda ? `Round ${this.numeroRonda}` : 'Round 1';
    //console.log('Buscando en el archivo:', textoBusqueda);

    for (let i = 0; i < jsonData.length; i++) {
      const fila = jsonData[i];

      if (fila[0] && fila[0].toString().includes(textoBusqueda)) {
        rondaEncontrada = true;
        i += 2;
        continue;
      }

      if (rondaEncontrada && fila[0]) {
        const numeroMesa = parseInt(fila[0]);
        const nombreBlanco = fila[2]?.toString().trim();
        const nombreNegro = fila[6]?.toString().trim();

        if (numeroMesa && nombreBlanco && nombreNegro) {
          emparejamientosTemp.push({
            numeroMesa,
            nombreBlancoCompleto: nombreBlanco,
            nombreNegroCompleto: nombreNegro,
            blancoEncontrado: false,
            negroEncontrado: false
          });
        }
      }
    }

    if (emparejamientosTemp.length === 0) {
      this.errorCarga = `No se encontraron emparejamientos válidos para ${textoBusqueda} en el archivo`;
      this.procesando = false;
      return;
    }

    this.emparejamientos = emparejamientosTemp;
    this.cargarJugadores();
  }

  cargarJugadores(): void {
    if (this.idTorneo) {
      this.inscripcionService.getByTorneo(this.idTorneo).subscribe({
        next: (inscripciones) => {
          this.jugadoresInscritos = inscripciones
            .filter(i => i.idCategoria === this.idCategoria && i.estado === 'confirmado')
            .map(i => i.jugador)
            .filter(j => j);

          //console.log('Jugadores inscritos:', this.jugadoresInscritos);

          this.jugadorService.getAll({ estado: 'activo' }).subscribe({
            next: (jugadores) => {
              this.todosJugadores = jugadores;
              this.validarJugadores();
              this.procesando = false;
              this.vistaPreviaActiva = true;
            },
            error: (err) => {
              console.error('Error al cargar todos los jugadores:', err);
              this.todosJugadores = this.jugadoresInscritos;
              this.validarJugadores();
              this.procesando = false;
              this.vistaPreviaActiva = true;
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar inscripciones:', err);
          this.errorCarga = 'Error al cargar la lista de jugadores inscritos';
          this.procesando = false;
        }
      });
    } else {
      this.jugadorService.getAll({ estado: 'activo' }).subscribe({
        next: (jugadores) => {
          this.todosJugadores = jugadores;
          this.validarJugadores();
          this.procesando = false;
          this.vistaPreviaActiva = true;
        },
        error: (err) => {
          console.error('Error al cargar jugadores:', err);
          this.errorCarga = 'Error al cargar la lista de jugadores';
          this.procesando = false;
        }
      });
    }
  }

  validarJugadores(): void {
    this.emparejamientos.forEach(emp => {
      const jugadorBlanco = this.buscarJugadorPorNombre(emp.nombreBlancoCompleto, this.jugadoresInscritos) ||
        this.buscarJugadorPorNombre(emp.nombreBlancoCompleto, this.todosJugadores);

      if (jugadorBlanco) {
        emp.idJugadorBlanco = jugadorBlanco.idJugador;
        emp.blancoEncontrado = true;
      }

      const jugadorNegro = this.buscarJugadorPorNombre(emp.nombreNegroCompleto, this.jugadoresInscritos) ||
        this.buscarJugadorPorNombre(emp.nombreNegroCompleto, this.todosJugadores);

      if (jugadorNegro) {
        emp.idJugadorNegro = jugadorNegro.idJugador;
        emp.negroEncontrado = true;
      }
    });

    this.archivoValido = this.emparejamientos.every(
      emp => emp.blancoEncontrado && emp.negroEncontrado
    );
  }

  buscarJugadorPorNombre(nombreCompleto: string, listaJugadores: Jugador[]): Jugador | undefined {
    const nombreBusqueda = nombreCompleto.toLowerCase().trim();

    let jugador = listaJugadores.find(j => {
      const nombreJugador = `${j.nombre} ${j.apellido1} ${j.apellido2 || ''}`.trim().toLowerCase();
      return nombreJugador === nombreBusqueda;
    });

    if (!jugador) {
      jugador = listaJugadores.find(j => {
        const nombreJugador = `${j.nombre} ${j.apellido1} ${j.apellido2 || ''}`.trim().toLowerCase();
        const nombreSinApellido2 = `${j.nombre} ${j.apellido1}`.trim().toLowerCase();

        return nombreJugador.includes(nombreBusqueda) ||
          nombreBusqueda.includes(nombreJugador) ||
          nombreSinApellido2 === nombreBusqueda;
      });
    }

    if (!jugador) {
      const partes = nombreBusqueda.split(' ');
      jugador = listaJugadores.find(j => {
        const nombreComp = `${j.nombre} ${j.apellido1} ${j.apellido2 || ''}`.toLowerCase();
        return partes.every(parte => nombreComp.includes(parte));
      });
    }

    return jugador;
  }

  getEmparejamientosValidos(): number {
    return this.emparejamientos.filter(emp => emp.blancoEncontrado && emp.negroEncontrado).length;
  }

  getEmparejamientosInvalidos(): number {
    return this.emparejamientos.filter(emp => !emp.blancoEncontrado || !emp.negroEncontrado).length;
  }

  confirmarGuardarMesas(): void {
    if (!this.archivoValido) return;

    this.confirmacionTitulo = 'Confirmar Guardado de Mesas';
    this.confirmacionMensaje = `¿Estás seguro de guardar ${this.emparejamientos.length} mesa(s) en la base de datos? Esta acción creará todos los emparejamientos para la ronda.`;
    this.confirmacionTextoConfirmar = `Guardar ${this.emparejamientos.length} Mesa(s)`;
    this.modalConfirmacionVisible = true;
  }

  async guardarMesas(): Promise<void> {
    if (!this.archivoValido || !this.idRonda) return;

    this.guardando = true;
    this.cerrarModalConfirmacion();

    try {
      const promesas = this.emparejamientos
        .filter(emp => emp.idJugadorBlanco && emp.idJugadorNegro)
        .map(emp => {
          const mesaDto: CreateMesaDto = {
            numeroMesa: emp.numeroMesa,
            idRonda: this.idRonda!,
            idJugadorBlanco: emp.idJugadorBlanco!,
            idJugadorNegro: emp.idJugadorNegro!,
            estado: 'pendiente'
          };
          return this.mesaService.createMesa(mesaDto).toPromise();
        });

      await Promise.all(promesas);

      this.cargaExitosa.emit();
      this.onCerrar();
    } catch (err) {
      console.error('Error al guardar mesas:', err);
      this.errorCarga = 'Error al guardar las mesas. Intenta nuevamente.';
      this.guardando = false;
    }
  }

  cerrarModalConfirmacion(): void {
    this.modalConfirmacionVisible = false;
  }

  resetModal(): void {
    this.archivo = null;
    this.emparejamientos = [];
    this.todosJugadores = [];
    this.jugadoresInscritos = [];
    this.cargando = false;
    this.procesando = false;
    this.guardando = false;
    this.errorCarga = '';
    this.archivoValido = false;
    this.vistaPreviaActiva = false;
    this.modalConfirmacionVisible = false;
  }

  onCerrar(): void {
    this.resetModal();
    this.cerrar.emit();
  }
}
