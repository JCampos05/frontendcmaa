import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SistemaPagoService } from '../../../../services/sistema-pago';
import { SistemaPago } from '../../../../models/sistema-pago';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

@Component({
  selector: 'app-sistemas-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastNoti],
  templateUrl: './sistemas-pago.html',
  styleUrls: ['./sistemas-pago.css']
})
export class SistemasPagoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  sistemasPago: SistemaPago[] = [];
  sistemaPagoForm!: FormGroup;
  
  mostrandoForm = false;
  editando: SistemaPago | null = null;
  
  mostrarModalEliminar = false;
  itemAEliminar: SistemaPago | null = null;

  constructor(
    private fb: FormBuilder,
    private sistemaPagoService: SistemaPagoService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarSistemasPago();
  }

  initForm(): void {
    this.sistemaPagoForm = this.fb.group({
      nombreCuenta: ['', Validators.required],
      banco: ['', Validators.required],
      numeroCuenta: ['', Validators.required],
      clabe: ['', [
        Validators.required,
        Validators.pattern(/^\d{18}$/),
        Validators.minLength(18),
        Validators.maxLength(18)
      ]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  cargarSistemasPago(): void {
    this.sistemaPagoService.getAll().subscribe({
      next: (data) => {
        this.sistemasPago = data;
      },
      error: (error) => {
        this.toast.error('Error', 'Error al cargar sistemas de pago');
        console.error('Error al cargar sistemas de pago:', error);
      }
    });
  }

  mostrarFormulario(): void {
    this.mostrandoForm = true;
    this.editando = null;
    this.sistemaPagoForm.reset();
  }

  editar(sistemaPago: SistemaPago): void {
    this.editando = sistemaPago;
    this.mostrandoForm = true;
    this.sistemaPagoForm.patchValue({
      nombreCuenta: sistemaPago.nombreCuenta,
      banco: sistemaPago.banco,
      numeroCuenta: sistemaPago.numeroCuenta,
      clabe: sistemaPago.clabe,
      telefono: sistemaPago.telefono
    });
  }

  guardar(): void {
    if (this.sistemaPagoForm.invalid) {
      this.sistemaPagoForm.markAllAsTouched();
      return;
    }

    const data = this.sistemaPagoForm.value;

    if (this.editando) {
      this.sistemaPagoService.update(this.editando.idSistemaPago!, data).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Sistema de pago actualizado correctamente');
          this.cargarSistemasPago();
          this.cancelarForm();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al actualizar sistema de pago');
        }
      });
    } else {
      this.sistemaPagoService.create(data).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Sistema de pago creado correctamente');
          this.cargarSistemasPago();
          this.cancelarForm();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al crear sistema de pago');
        }
      });
    }
  }

  cancelarForm(): void {
    this.mostrandoForm = false;
    this.editando = null;
    this.sistemaPagoForm.reset();
  }

  confirmarEliminar(sistemaPago: SistemaPago): void {
    this.itemAEliminar = sistemaPago;
    this.mostrarModalEliminar = true;
  }

  eliminar(): void {
    if (!this.itemAEliminar) return;

    this.sistemaPagoService.delete(this.itemAEliminar.idSistemaPago!).subscribe({
      next: () => {
        this.toast.success('Éxito', 'Sistema de pago eliminado correctamente');
        this.cargarSistemasPago();
        this.cerrarModalEliminar();
      },
      error: (error) => {
        this.toast.error('Error', error.error?.message || 'Error al eliminar sistema de pago');
        this.cerrarModalEliminar();
      }
    });
  }

  toggleActivo(sistemaPago: SistemaPago): void {
    const nuevoEstado = !sistemaPago.activo;
    
    this.sistemaPagoService.toggleActive(sistemaPago.idSistemaPago!, nuevoEstado).subscribe({
      next: () => {
        sistemaPago.activo = nuevoEstado;
        this.toast.success('Éxito', `Sistema de pago ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
      },
      error: (error) => {
        this.toast.error('Error', error.error?.message || 'Error al cambiar estado');
      }
    });
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.itemAEliminar = null;
  }

  formatearClabe(clabe: string): string {
    if (!clabe) return '';
    // Formato: XXX XXX XXXX XXXX XXXX
    return clabe.replace(/(\d{3})(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5');
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  get clabeInvalido(): boolean {
    const control = this.sistemaPagoForm.get('clabe');
    return !!(control && control.invalid && control.touched);
  }

  get telefonoInvalido(): boolean {
    const control = this.sistemaPagoForm.get('telefono');
    return !!(control && control.invalid && control.touched);
  }
}
