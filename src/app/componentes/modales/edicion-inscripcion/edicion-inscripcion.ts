import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { InscripcionService } from '../../../services/inscripcion';
import { JugadorService } from '../../../services/jugador';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../modal-confirmacion/modal-confirmacion';
import { extraerMensajeError } from '../../../utils/http-error.util';

@Component({
  selector: 'app-modal-edicion-inscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNoti, ModalConfirmacionComponent],
  templateUrl: './edicion-inscripcion.html',
  styleUrls: ['./edicion-inscripcion.css']
})
export class ModalEdicionInscripcionComponent implements OnChanges {
  @Input() visible = false;
  @Input() inscripcion: any = null;
  @Input() categorias: any[] = [];
  @ViewChild(ToastNoti) toast!: ToastNoti;

  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  jugadorEditando: any = null;
  idCategoriaOriginal: number | null = null;
  mostrarModalCambioCategoria = false;

  constructor(
    private inscripcionService: InscripcionService,
    private jugadorService: JugadorService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inscripcion'] && this.inscripcion) {
      this.inicializarFormulario();
    }
  }

  inicializarFormulario(): void {
    if (!this.inscripcion) return;

    let fechaNac = '';
    const fechaNacimiento = this.inscripcion.jugador?.fechaNacimiento || this.inscripcion.jugador?.fecha_nacimiento;
    
    if (fechaNacimiento) {
      const fecha = new Date(fechaNacimiento);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechaNac = `${year}-${month}-${day}`;
    }

    const pagoConfirmadoBooleano = Boolean(
      this.inscripcion.pagoConfirmado === true ||
      this.inscripcion.pago_confirmado === true ||
      this.inscripcion.pagoConfirmado === 1 ||
      this.inscripcion.pago_confirmado === 1
    );

    const montoNumerico = Number(this.inscripcion.montoPagado || this.inscripcion.monto_pagado) || 0;

    this.jugadorEditando = {
      // Datos del jugador
      idJugador: this.inscripcion.jugador?.idJugador,
      nombre: this.inscripcion.jugador?.nombre || '',
      apellido1: this.inscripcion.jugador?.apellido1 || '',
      apellido2: this.inscripcion.jugador?.apellido2 || '',
      telefono: this.inscripcion.jugador?.telefono || '',
      fecha_nacimiento: fechaNac,
      rating: this.inscripcion.jugador?.rating || 0,
      estado: this.inscripcion.jugador?.estado || 'activo',
      
      // Datos de la inscripción
      idInscripcion: this.inscripcion.idInscripcion,
      idCategoria: this.inscripcion.idCategoria,
      notas: this.inscripcion.notas || '',
      monto_pagado: montoNumerico,
      pago_confirmado: pagoConfirmadoBooleano,
      // El enum real del backend es 'pendiente_pago', no 'pendiente' — con el
      // valor viejo el <select> no encontraba ninguna opción que hiciera
      // match y se quedaba en blanco cuando el pago estaba pendiente.
      estado_inscripcion: this.inscripcion.estado || 'pendiente_pago'
    };

    this.idCategoriaOriginal = this.inscripcion.idCategoria ?? null;
    this.mostrarModalCambioCategoria = false;
  }

  getNombreCategoria(idCategoria: number | null): string {
    if (idCategoria === null || idCategoria === undefined) return 'Sin categoría';
    const categoria = this.categorias.find(c => c.idCategoria === Number(idCategoria));
    return categoria?.nombre || 'Sin categoría';
  }

  getCostoCategoria(idCategoria: number | null): number {
    if (idCategoria === null || idCategoria === undefined) return 0;
    const categoria = this.categorias.find(c => c.idCategoria === Number(idCategoria));
    return Number(categoria?.costo) || 0;
  }

  get huboCambioDeCategoria(): boolean {
    if (!this.jugadorEditando) return false;
    const nueva = this.jugadorEditando.idCategoria ? Number(this.jugadorEditando.idCategoria) : null;
    return nueva !== this.idCategoriaOriginal;
  }

  get mensajeCambioCategoria(): string {
    if (!this.jugadorEditando) return '';
    const nueva = Number(this.jugadorEditando.idCategoria);
    return `Vas a cambiar la categoría de <strong>${this.getNombreCategoria(this.idCategoriaOriginal)}</strong> ` +
      `($${this.getCostoCategoria(this.idCategoriaOriginal)}) a <strong>${this.getNombreCategoria(nueva)}</strong> ` +
      `($${this.getCostoCategoria(nueva)}).`;
  }

  get mensajeSecundarioCambioCategoria(): string {
    const monto = Number(this.jugadorEditando?.monto_pagado) || 0;
    return monto > 0
      ? `El monto ya pagado ($${monto.toFixed(2)}) NO se modificará automáticamente — ajústalo manualmente si corresponde.`
      : 'Esta inscripción no tiene un pago registrado todavía.';
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  /** Solo informativo — cambiar de categoría nunca toca `monto_pagado`. */
  getCostoCategoriaSeleccionada(): number | null {
    if (!this.jugadorEditando?.idCategoria) return null;
    const categoria = this.categorias.find(c => c.idCategoria === Number(this.jugadorEditando.idCategoria));
    return categoria?.costo ?? null;
  }

  guardarEdicion(): void {
    if (!this.jugadorEditando) return;

    if (!this.jugadorEditando.nombre?.trim()) {
      //alert('El nombre es obligatorio');
      this.toast.warning('Atención','El nombre es obligatorio');
      return;
    }

    if (!this.jugadorEditando.apellido1?.trim()) {
      this.toast.warning('Atención','El primer apellido es obligatorio');
      //alert('El primer apellido es obligatorio');
      return;
    }

    const montoPagado = Number(this.jugadorEditando.monto_pagado) || 0;
    if (montoPagado < 0) {
      this.toast.warning('Atencion','El monto pagado no puede ser negativo');
      //alert('El monto pagado no puede ser negativo');
      return;
    }

    if (this.huboCambioDeCategoria) {
      this.mostrarModalCambioCategoria = true;
      return;
    }

    this.procederGuardar();
  }

  confirmarCambioCategoria(): void {
    this.mostrarModalCambioCategoria = false;
    this.procederGuardar();
  }

  cancelarCambioCategoria(): void {
    this.mostrarModalCambioCategoria = false;
  }

  private procederGuardar(): void {
    const montoPagado = Number(this.jugadorEditando.monto_pagado) || 0;

    const datosJugador = {
      nombre: this.jugadorEditando.nombre.trim(),
      apellido1: this.jugadorEditando.apellido1.trim(),
      apellido2: this.jugadorEditando.apellido2?.trim() || null,
      telefono: this.jugadorEditando.telefono?.trim() || null,
      fecha_nacimiento: this.jugadorEditando.fecha_nacimiento || null,
      rating: Number(this.jugadorEditando.rating) || 0,
      estado: this.jugadorEditando.estado || 'activo'
    };

    this.jugadorService.update(this.jugadorEditando.idJugador, datosJugador).subscribe({
      next: () => {

        const pagoConfirmadoBooleano = Boolean(
          this.jugadorEditando.pago_confirmado === true || 
          this.jugadorEditando.pago_confirmado === 'true' || 
          this.jugadorEditando.pago_confirmado === 1
        );

        const montoPagadoNumerico = Number(montoPagado);

        const datosInscripcion = {
          idCategoria: Number(this.jugadorEditando.idCategoria),
          notas: this.jugadorEditando.notas?.trim() || null,
          monto_pagado: montoPagadoNumerico,
          pago_confirmado: pagoConfirmadoBooleano,
          estado: this.jugadorEditando.estado_inscripcion
        };


        this.inscripcionService.update(this.jugadorEditando.idInscripcion, datosInscripcion).subscribe({
          next: (response) => {
            // El toast de éxito se muestra en el padre (inscripciones-torneo.ts),
            // no aquí — este componente se destruye al cerrar el modal antes
            // de que su propio <app-toast-noti> alcance a renderizar nada.
            this.actualizado.emit();
            this.cerrarModal();
          },
          error: (err: HttpErrorResponse) => {
            // Detalle técnico solo en consola — el usuario final no necesita
            // ver el nombre interno del campo/validación que falló.
            console.error('Error al actualizar inscripción:', extraerMensajeError(err), err);
            this.toast.error('Error al actualizar la inscripción', 'No se pudo guardar. Intenta de nuevo o contacta a soporte.');
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar jugador:', extraerMensajeError(err), err);
        this.toast.error('Error al actualizar el jugador', 'No se pudo guardar. Intenta de nuevo o contacta a soporte.');
      }
    });
  }
}
