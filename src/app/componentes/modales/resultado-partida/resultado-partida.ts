import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MesaService } from '../../../services/mesa';
import { PartidaService } from '../../../services/partida';
import { Mesa, UpdateMesaDto } from '../../../models/mesa';
import { CreatePartidaDto, TipoFinalizacion } from '../../../models/partida';

@Component({
  selector: 'app-modal-resultado-partida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resultado-partida.html',
  styleUrls: ['./resultado-partida.css']
})
export class ModalResultadoPartidaComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() mesa: Mesa | null = null;
  @Input() modoEdicion = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() resultadoGuardado = new EventEmitter<void>();

  resultado: string = '';
  tipoFinalizacion: TipoFinalizacion | null = null;
  duracionMinutos: number | null = null;
  ilegalesBlanco: number = 0;
  ilegalesNegro: number = 0;
  descripcionFinalizacion: string = '';

  guardando = false;
  guardandoIlegales = false;
  guardandoNotas = false;

  mensajeValidacion = '';
  tipoMensaje: 'success' | 'error' | 'warning' | '' = '';

  mesaBloqueada = false;
  usuarioActual: string = '';
  timestampInicial: string | null = null;
  intervaloVerificacion: any = null;

  constructor(
    private mesaService: MesaService,
    private partidaService: PartidaService
  ) {
    this.usuarioActual = localStorage.getItem('telefono') || 'Usuario';
  }

  ngOnInit(): void {
    if (this.visible && this.mesa) {
      this.intentarBloquearMesa();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.mesa) {
      this.resetForm();
      this.ilegalesBlanco = this.mesa.ilegalesBlanco || 0;
      this.ilegalesNegro = this.mesa.ilegalesNegro || 0;
      this.descripcionFinalizacion = this.mesa.notas || '';
      this.timestampInicial = this.mesa.timestampEdicion
        ? (typeof this.mesa.timestampEdicion === 'string'
          ? this.mesa.timestampEdicion
          : new Date(this.mesa.timestampEdicion).toISOString())
        : null;

      // SIEMPRE intentar bloquear, tanto en modo edición como en registro normal
      this.intentarBloquearMesa();
    } else if (changes['visible'] && !this.visible) {
      this.detenerVerificacionConcurrencia();
      this.liberarBloqueoMesa();
    }
  }

  ngOnDestroy(): void {
    this.detenerVerificacionConcurrencia();
    this.liberarBloqueoMesa();
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning', duracion: number = 3000): void {
    this.mensajeValidacion = mensaje;
    this.tipoMensaje = tipo;

    if (duracion > 0) {
      setTimeout(() => {
        this.mensajeValidacion = '';
        this.tipoMensaje = '';
      }, duracion);
    }
  }

  cargarDatosExistentes(): void {
    if (!this.mesa?.partida) return;

    this.resultado = this.mesa.partida.resultado || '';
    this.tipoFinalizacion = this.mesa.partida.tipo_finalizacion || null;
    this.duracionMinutos = this.mesa.partida.duracion_minutos || null;
    this.descripcionFinalizacion = this.mesa.partida.descripcion_finalizacion || this.mesa.notas || '';
  }

  intentarBloquearMesa(): void {
    if (!this.mesa?.idMesa) return;

    // Si estamos en modo edición, cargar datos existentes antes de bloquear
    if (this.modoEdicion && this.mesa.partida) {
      this.cargarDatosExistentes();
    }

    // Bloquear la mesa (indicando si es modo edición)
    this.mesaService.bloquearMesa(this.mesa.idMesa, this.modoEdicion).subscribe({
      next: (response) => {
        if (response.success) {
          this.mesaBloqueada = false;
          this.mensajeValidacion = '';
          this.tipoMensaje = '';

          const timestamp = response.data?.timestampEdicion;
          this.timestampInicial = timestamp
            ? (typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString())
            : new Date().toISOString();

          this.iniciarVerificacionConcurrencia();
        }
      },
      error: (err) => {
        if (err.status === 423) {
          this.mesaBloqueada = true;
          const usuarioBloqueador = err.error?.data?.usuarioEditando || 'Otro usuario';
          const tiempoRestante = err.error?.data?.tiempoRestante || 0;
          this.mostrarMensaje(
            `Esta mesa está siendo editada por ${usuarioBloqueador}. Tiempo restante: ${Math.ceil(tiempoRestante / 60)} minutos`,
            'error',
            0
          );
        } else if (err.status === 400 && err.error?.code === 'MESA_FINALIZADA') {
          this.mesaBloqueada = true;
          this.mostrarMensaje('Esta mesa ya ha sido finalizada', 'error', 0);
        } else {
          console.error('Error al bloquear mesa:', err);
          this.mostrarMensaje('No se pudo obtener acceso a la mesa', 'error');
        }
      }
    });
  }

  liberarBloqueoMesa(): void {
    if (!this.mesa?.idMesa) return;

    this.mesaService.liberarMesa(this.mesa.idMesa).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error('Error al liberar mesa:', err);
      }
    });
  }

  iniciarVerificacionConcurrencia(): void {
    if (!this.mesa?.idMesa) return;

    this.intervaloVerificacion = setInterval(() => {
      if (this.mesa?.idMesa && this.visible && !this.mesaBloqueada) {
        this.verificarEstadoMesa();
      }
    }, 3000);
  }

  detenerVerificacionConcurrencia(): void {
    if (this.intervaloVerificacion) {
      clearInterval(this.intervaloVerificacion);
      this.intervaloVerificacion = null;
    }
  }

  verificarEstadoMesa(): void {
    if (!this.mesa?.idMesa) return;

    this.mesaService.getMesaById(this.mesa.idMesa).subscribe({
      next: (mesaActualizada) => {
        if (mesaActualizada) {
          if (this.timestampInicial && mesaActualizada.timestampEdicion) {
            const tsInicial = new Date(this.timestampInicial).getTime();
            const tsActual = new Date(mesaActualizada.timestampEdicion).getTime();

            if (tsActual > tsInicial) {
              this.ilegalesBlanco = mesaActualizada.ilegalesBlanco || 0;
              this.ilegalesNegro = mesaActualizada.ilegalesNegro || 0;
              this.descripcionFinalizacion = mesaActualizada.notas || '';

              this.timestampInicial = typeof mesaActualizada.timestampEdicion === 'string'
                ? mesaActualizada.timestampEdicion
                : new Date(mesaActualizada.timestampEdicion).toISOString();

              if (this.mesa) {
                this.mesa.ilegalesBlanco = mesaActualizada.ilegalesBlanco;
                this.mesa.ilegalesNegro = mesaActualizada.ilegalesNegro;
                this.mesa.notas = mesaActualizada.notas;
              }
            }
          }
        }
      },
      error: (err) => {
        console.error('Error al verificar estado de mesa:', err);
      }
    });
  }

  seleccionarResultado(resultado: string): void {
    if (this.mesaBloqueada) {
      this.mostrarMensaje('No puedes editar, otro usuario tiene el control de esta mesa', 'warning');
      return;
    }
    this.resultado = resultado;
    this.mensajeValidacion = '';
    this.tipoMensaje = '';
  }

  incrementarIlegales(color: 'blanco' | 'negro'): void {
    if (this.mesaBloqueada) return;

    if (color === 'blanco') {
      this.ilegalesBlanco++;
    } else {
      this.ilegalesNegro++;
    }
  }

  decrementarIlegales(color: 'blanco' | 'negro'): void {
    if (this.mesaBloqueada) return;

    if (color === 'blanco' && this.ilegalesBlanco > 0) {
      this.ilegalesBlanco--;
    } else if (color === 'negro' && this.ilegalesNegro > 0) {
      this.ilegalesNegro--;
    }
  }

  guardarIlegales(): void {
    if (!this.mesa?.idMesa || this.mesaBloqueada) return;

    this.guardandoIlegales = true;
    this.mensajeValidacion = '';
    this.tipoMensaje = '';

    const mesaDto: UpdateMesaDto = {
      ilegalesBlanco: this.ilegalesBlanco,
      ilegalesNegro: this.ilegalesNegro,
      timestampEdicion: this.timestampInicial || new Date().toISOString()
    };

    this.mesaService.updateMesa(this.mesa.idMesa, mesaDto).subscribe({
      next: (mesaActualizada) => {
        this.guardandoIlegales = false;
        if (mesaActualizada && mesaActualizada.timestampEdicion) {
          this.timestampInicial = typeof mesaActualizada.timestampEdicion === 'string'
            ? mesaActualizada.timestampEdicion
            : new Date(mesaActualizada.timestampEdicion).toISOString();
        }
        this.mostrarMensaje('Jugadas ilegales guardadas correctamente', 'success', 2000);
      },
      error: (err) => {
        console.error('Error al guardar ilegales:', err);

        if (err.status === 423) {
          this.mesaBloqueada = true;
          this.mostrarMensaje('Otro usuario ha tomado el control de esta mesa', 'error', 0);
        } else if (err.status === 409) {
          this.mostrarMensaje('Los datos han sido modificados, actualizando...', 'warning');
          this.verificarEstadoMesa();
        } else {
          this.mostrarMensaje('Error al guardar jugadas ilegales', 'error');
        }

        this.guardandoIlegales = false;
      }
    });
  }

  guardarNotas(): void {
    if (!this.mesa?.idMesa || this.mesaBloqueada) return;

    this.guardandoNotas = true;
    this.mensajeValidacion = '';
    this.tipoMensaje = '';

    const mesaDto: UpdateMesaDto = {
      notas: this.descripcionFinalizacion,
      timestampEdicion: this.timestampInicial || new Date().toISOString()
    };

    this.mesaService.updateMesa(this.mesa.idMesa, mesaDto).subscribe({
      next: (mesaActualizada) => {
        this.guardandoNotas = false;
        if (mesaActualizada && mesaActualizada.timestampEdicion) {
          this.timestampInicial = typeof mesaActualizada.timestampEdicion === 'string'
            ? mesaActualizada.timestampEdicion
            : new Date(mesaActualizada.timestampEdicion).toISOString();
        }
        this.mostrarMensaje('Notas guardadas correctamente', 'success', 2000);
      },
      error: (err) => {
        console.error('Error al guardar notas:', err);

        if (err.status === 423) {
          this.mesaBloqueada = true;
          this.mostrarMensaje('Otro usuario ha tomado el control de esta mesa', 'error', 0);
        } else if (err.status === 409) {
          this.mostrarMensaje('Los datos han sido modificados, actualizando...', 'warning');
          this.verificarEstadoMesa();
        } else {
          this.mostrarMensaje('Error al guardar notas', 'error');
        }

        this.guardandoNotas = false;
      }
    });
  }

  formularioValido(): boolean {
    return Boolean(this.resultado && this.tipoFinalizacion && !this.mesaBloqueada);
  }


  actualizarMesaEdicion(): void {
    if (!this.mesa?.idMesa) return;

    const mesaDto: UpdateMesaDto = {
      ilegalesBlanco: this.ilegalesBlanco,
      ilegalesNegro: this.ilegalesNegro,
      notas: this.descripcionFinalizacion,
      timestampEdicion: this.timestampInicial || new Date().toISOString()
      // NO incluir estado para que el backend libere el bloqueo
    };

    this.mesaService.updateMesa(this.mesa.idMesa, mesaDto).subscribe({
      next: () => {
        this.detenerVerificacionConcurrencia();
        this.liberarBloqueoMesa();
        this.mostrarMensaje('Resultado actualizado correctamente', 'success', 2000);

        setTimeout(() => {
          this.resultadoGuardado.emit();
          this.resetForm();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al actualizar mesa:', err);

        if (err.status === 423) {
          this.mesaBloqueada = true;
          this.mostrarMensaje('Otro usuario ha tomado el control de esta mesa', 'error', 0);
        } else if (err.status === 409) {
          this.mostrarMensaje('Los datos han sido modificados, actualizando...', 'warning');
          this.verificarEstadoMesa();
        } else {
          this.mostrarMensaje('Error al actualizar la mesa.', 'error');
        }

        this.guardando = false;
      }
    });
  }

  actualizarPartidaExistente(): void {
    if (!this.mesa?.partida?.idPartida) return;

    const idJugadorGanador = this.obtenerIdJugadorGanador();

    const updatePartidaDto = {
      resultado: this.resultado,
      tipo_finalizacion: this.tipoFinalizacion!,
      descripcion_finalizacion: this.descripcionFinalizacion || undefined,
      duracion_minutos: this.duracionMinutos || undefined,
      idJugadorGanador: idJugadorGanador || undefined
    };

    this.partidaService.updatePartida(this.mesa.partida.idPartida, updatePartidaDto).subscribe({
      next: () => {
        this.actualizarMesaEdicion();
      },
      error: (err) => {
        console.error('Error al actualizar partida:', err);
        this.mostrarMensaje('Error al actualizar el resultado. Intenta nuevamente.', 'error');
        this.guardando = false;
      }
    });
  }


  guardarResultado(): void {
    if (!this.formularioValido() || !this.mesa?.idMesa || this.mesaBloqueada) return;

    this.guardando = true;
    this.mensajeValidacion = '';
    this.tipoMensaje = '';

    // Si estamos en modo edición, actualizar la partida existente
    if (this.modoEdicion && this.mesa.partida?.idPartida) {
      this.actualizarPartidaExistente();
      return;
    }

    // Si no, crear una nueva partida
    const idJugadorGanador = this.obtenerIdJugadorGanador();

    const partidaDto: CreatePartidaDto = {
      idMesa: this.mesa.idMesa,
      resultado: this.resultado,
      tipo_finalizacion: this.tipoFinalizacion!,
      descripcion_finalizacion: this.descripcionFinalizacion || undefined,
      duracion_minutos: this.duracionMinutos || undefined,
      idJugadorGanador: idJugadorGanador || undefined
    };

    this.partidaService.createPartida(partidaDto).subscribe({
      next: () => {
        this.actualizarMesa();
      },
      error: (err) => {
        console.error('Error al crear partida:', err);

        if (err.status === 400 && err.error?.code === 'MESA_YA_FINALIZADA') {
          this.mostrarMensaje('Esta mesa ya ha sido finalizada por otro usuario', 'error', 0);
          this.mesaBloqueada = true;
        } else if (err.status === 400 && err.error?.code === 'PARTIDA_DUPLICADA') {
          this.mostrarMensaje('Ya existe un resultado registrado para esta mesa', 'error', 0);
          this.mesaBloqueada = true;
        } else {
          this.mostrarMensaje('Error al guardar el resultado. Intenta nuevamente.', 'error');
        }

        this.guardando = false;
      }
    });
  }

  actualizarMesa(): void {
    if (!this.mesa?.idMesa) return;

    const mesaDto: UpdateMesaDto = {
      estado: 'finalizada',
      ilegalesBlanco: this.ilegalesBlanco,
      ilegalesNegro: this.ilegalesNegro,
      notas: this.descripcionFinalizacion,
      timestampEdicion: this.timestampInicial || new Date().toISOString()
    };

    console.log(' Enviando actualización de mesa:', mesaDto); // DEBUG

    this.mesaService.updateMesa(this.mesa.idMesa, mesaDto).subscribe({
      next: () => {
        this.detenerVerificacionConcurrencia();
        this.liberarBloqueoMesa();
        this.resultadoGuardado.emit();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al actualizar mesa:', err);
        this.mostrarMensaje('Error al actualizar la mesa.', 'error');
        this.guardando = false;
      }
    });
  }

  obtenerIdJugadorGanador(): number | null {
    if (!this.mesa) return null;

    if (this.resultado === '1-0') {
      return this.mesa.idJugadorBlanco;
    } else if (this.resultado === '0-1') {
      return this.mesa.idJugadorNegro;
    }
    return null;
  }

  resetForm(): void {
    this.resultado = '';
    this.tipoFinalizacion = null;
    this.duracionMinutos = null;
    this.ilegalesBlanco = 0;
    this.ilegalesNegro = 0;
    this.descripcionFinalizacion = '';
    this.guardando = false;
    this.guardandoIlegales = false;
    this.guardandoNotas = false;
    this.mensajeValidacion = '';
    this.tipoMensaje = '';
    this.mesaBloqueada = false;
    this.timestampInicial = null;
  }

  cerrarModal(): void {
    this.detenerVerificacionConcurrencia();
    this.liberarBloqueoMesa();
    this.cerrar.emit();
  }
}
