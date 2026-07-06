import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InscripcionService } from '../../../services/inscripcion';
import { JugadorService } from '../../../services/jugador';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

@Component({
  selector: 'app-modal-edicion-inscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNoti],
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
      estado_inscripcion: this.inscripcion.estado || 'pendiente'
    };
  }

  cerrarModal(): void {
    this.cerrar.emit();
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
            this.toast.success('Inscripción hecha','Inscripción actualizada exitosamente');
            //alert('Inscripción actualizada exitosamente');
            this.actualizado.emit();
            this.cerrarModal();
          },
          error: (err) => {
            //console.error('❌ Error al actualizar inscripción:', err);
            const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al actualizar la inscripción';
            this.toast.error('Error', mensaje);
            //alert(`Error: ${mensaje}`);
          }
        });
      },
      error: (err) => {
        //console.error('❌ Error al actualizar jugador:', err);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al actualizar el jugador';
        this.toast.error('Error', mensaje);
        //alert(`Error: ${mensaje}`);
      }
    });
  }
}
