import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InscripcionService } from '../../../services/inscripcion/inscripcion';
import { TorneoService } from '../../../services/torneo/torneo';

@Component({
  selector: 'app-inscripcion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './inscripcion.html',
  styleUrls: ['./inscripcion.css']
})
export class InscripcionComponent implements OnInit {
  inscripcionForm: FormGroup;
  pasoActual: number = 1;
  totalPasos: number = 4;
  torneos: any[] = [];
  categorias: any[] = [];
  loading: boolean = false;
  submitted: boolean = false;
  mensajeExito: boolean = false;
  mostrarConfirmacionSalida: boolean = false;
  errores: string[] = [];

  categoriaSeleccionada: any = null;
  costoInscripcion: number = 0;
  torneoIdInicial: number | null = null;

  dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];
  anios: number[] = [];

  constructor(
    private fb: FormBuilder,
    private inscripcionService: InscripcionService,
    private torneoService: TorneoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= anioActual - 100; i--) {
      this.anios.push(i);
    }

    this.inscripcionForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.soloLetrasValidator
      ]],
      apellido1: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.soloLetrasValidator
      ]],
      apellido2: ['', [
        Validators.minLength(2),
        Validators.maxLength(100),
        this.soloLetrasValidator
      ]],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^\d{10}$/),
        this.telefonoValidator
      ]],
      dia_nacimiento: ['', Validators.required],
      mes_nacimiento: ['', Validators.required],
      anio_nacimiento: ['', Validators.required],
      torneo_id: ['', Validators.required],
      categoria_id: ['', Validators.required],
      notas: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.torneoIdInicial = +params['id'];
        this.cargarTorneosActivos();
      } else {
        this.cargarTorneosActivos();
      }
    });
  }

  soloLetrasValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const regex = /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/;
    return regex.test(control.value) ? null : { soloLetras: true };
  }

  telefonoValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const telefono = control.value.replace(/\s/g, '');
    const regex = /^\d{10}$/;
    return regex.test(telefono) ? null : { telefonoInvalido: true };
  }

  cargarTorneosActivos(): void {
    this.torneoService.getActivos().subscribe({
      next: (torneos) => {
        const ahora = new Date();

        this.torneos = (torneos || []).filter(torneo => {
          const cierreInscripciones = torneo.cierreInscripciones || torneo.cierre_inscripciones;

          if (!cierreInscripciones) {
            return true;
          }

          try {
            const fechaCierre = new Date(cierreInscripciones);
            return ahora < fechaCierre;
          } catch (e) {
            console.error('Error al verificar cierre de inscripciones:', e);
            return true;
          }
        });

        console.log('Torneos con inscripciones abiertas:', this.torneos);

        if (this.torneos.length === 0) {
          this.errores = ['No hay torneos disponibles con inscripciones abiertas en este momento'];
        } else if (this.torneoIdInicial) {
          const torneoEncontrado = this.torneos.find(t => t.idTorneo === this.torneoIdInicial);

          if (torneoEncontrado) {
            this.inscripcionForm.patchValue({ torneo_id: this.torneoIdInicial });
            this.onTorneoChange({ target: { value: this.torneoIdInicial.toString() } });
          } else {
            this.errores = ['El torneo seleccionado ya no tiene inscripciones abiertas'];
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar torneos:', error);
        this.errores = ['Error al cargar los torneos disponibles'];
      }
    });
  }

  onTorneoChange(event: any): void {
    const torneoId = event.target.value;
    console.log('Torneo seleccionado - Valor:', torneoId, 'Tipo:', typeof torneoId);

    if (torneoId && torneoId !== '' && torneoId !== null) {
      const torneoIdNumero = Number(torneoId);

      if (isNaN(torneoIdNumero) || torneoIdNumero <= 0) {
        console.error('El ID del torneo no es válido:', torneoId);
        this.errores = ['Error al seleccionar el torneo. Por favor, intente nuevamente.'];
        this.categorias = [];
        return;
      }

      this.loading = true;
      this.errores = []; // Limpiar errores previos

      console.log('Cargando categorías para torneo ID:', torneoIdNumero);

      this.torneoService.getCategoriasByTorneo(torneoIdNumero).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Respuesta completa de categorías:', response);

          // El backend devuelve { success: true, categorias: [...] }
          this.categorias = response.categorias || [];
          console.log('Categorías cargadas:', this.categorias.length);

          if (this.categorias.length === 0) {
            this.errores = ['Este torneo no tiene categorías disponibles'];
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al cargar categorías:', error);
          this.categorias = [];

          if (error.status === 404) {
            this.errores = ['No se encontraron categorías para este torneo'];
          } else if (error.status === 400) {
            this.errores = ['Error al cargar las categorías. Verifique que el torneo sea válido.'];
          } else {
            this.errores = ['Error al cargar las categorías del torneo'];
          }
        }
      });
    } else {
      this.categorias = [];
    }

    // Resetear la categoría seleccionada
    this.inscripcionForm.patchValue({ categoria_id: '' });
    this.categoriaSeleccionada = null;
    this.costoInscripcion = 0;
  }

  onCategoriaChange(event: any): void {
    const categoriaId = event.target.value;
    console.log('Categoría seleccionada - ID:', categoriaId);

    if (categoriaId && categoriaId !== '' && this.categorias.length > 0) {
      const categoriaIdNumero = Number(categoriaId);
      this.categoriaSeleccionada = this.categorias.find(cat => cat.idCategoria === categoriaIdNumero);

      if (this.categoriaSeleccionada) {
        this.costoInscripcion = this.categoriaSeleccionada.costo || 0;
        console.log('Costo de inscripción:', this.costoInscripcion);
      } else {
        this.costoInscripcion = 0;
      }
    } else {
      this.categoriaSeleccionada = null;
      this.costoInscripcion = 0;
    }
  }

  validarPasoActual(): boolean {
    this.errores = [];

    switch (this.pasoActual) {
      case 1:
        return this.validarCampos(['nombre', 'apellido1', 'apellido2']);
      case 2:
        return this.validarCampos(['telefono']);
      case 3:
        return this.validarFechaNacimiento();
      case 4:
        return this.validarCampos(['torneo_id', 'categoria_id']);
      default:
        return false;
    }
  }

  validarFechaNacimiento(): boolean {
    const dia = this.inscripcionForm.get('dia_nacimiento')?.value;
    const mes = this.inscripcionForm.get('mes_nacimiento')?.value;
    const anio = this.inscripcionForm.get('anio_nacimiento')?.value;

    if (!dia || !mes || !anio) {
      this.errores.push('Debe completar la fecha de nacimiento completa');
      return false;
    }

    const fecha = new Date(anio, mes - 1, dia);
    if (fecha.getDate() !== parseInt(dia) ||
      fecha.getMonth() !== parseInt(mes) - 1 ||
      fecha.getFullYear() !== parseInt(anio)) {
      this.errores.push('La fecha de nacimiento no es válida');
      return false;
    }

    if (fecha > new Date()) {
      this.errores.push('La fecha de nacimiento no puede ser futura');
      return false;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();

    if (mesActual < fecha.getMonth() || (mesActual === fecha.getMonth() && diaActual < fecha.getDate())) {
      edad--;
    }

    if (edad < 5) {
      this.errores.push('La edad mínima para participar es 5 años');
      return false;
    }

    if (edad > 120) {
      this.errores.push('La fecha de nacimiento no es válida');
      return false;
    }

    return true;
  }

  validarCampos(campos: string[]): boolean {
    let valido = true;

    campos.forEach(campo => {
      const control = this.inscripcionForm.get(campo);

      if (control && control.invalid && (control.dirty || control.touched || this.submitted)) {
        valido = false;

        if (control.errors) {
          if (control.errors['required']) {
            this.errores.push(`El campo ${this.getNombreCampo(campo)} es obligatorio`);
          }
          if (control.errors['minlength']) {
            this.errores.push(`${this.getNombreCampo(campo)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`);
          }
          if (control.errors['maxlength']) {
            this.errores.push(`${this.getNombreCampo(campo)} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres`);
          }
          if (control.errors['soloLetras']) {
            this.errores.push(`${this.getNombreCampo(campo)} solo puede contener letras`);
          }
          if (control.errors['pattern'] || control.errors['telefonoInvalido']) {
            this.errores.push('El teléfono debe tener exactamente 10 dígitos');
          }
        }
      }
    });

    return valido;
  }

  getNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'nombre': 'Nombre',
      'apellido1': 'Primer apellido',
      'apellido2': 'Segundo apellido',
      'telefono': 'Teléfono',
      'torneo_id': 'Torneo',
      'categoria_id': 'Categoría'
    };
    return nombres[campo] || campo;
  }

  siguientePaso(): void {
    this.submitted = true;

    if (this.validarPasoActual()) {
      this.pasoActual++;
      this.submitted = false;
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual > 1) {
      this.pasoActual--;
      this.errores = [];
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errores = [];

    if (!this.validarPasoActual()) {
      return;
    }

    if (this.inscripcionForm.invalid) {
      Object.keys(this.inscripcionForm.controls).forEach(key => {
        const control = this.inscripcionForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const torneoId = Number(this.inscripcionForm.value.torneo_id);
    const torneoSeleccionado = this.torneos.find(t => t.idTorneo === torneoId);

    if (torneoSeleccionado) {
      const cierreInscripciones = torneoSeleccionado.cierreInscripciones || torneoSeleccionado.cierre_inscripciones;

      if (cierreInscripciones) {
        const fechaCierre = new Date(cierreInscripciones);
        const ahora = new Date();

        if (ahora >= fechaCierre) {
          this.errores = ['Las inscripciones para este torneo ya han cerrado'];
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    const dia = String(this.inscripcionForm.value.dia_nacimiento).padStart(2, '0');
    const mes = String(this.inscripcionForm.value.mes_nacimiento).padStart(2, '0');
    const anio = this.inscripcionForm.value.anio_nacimiento;
    const fecha_nacimiento = `${anio}-${mes}-${dia}`;

    const categoriaId = Number(this.inscripcionForm.value.categoria_id);

    if (isNaN(categoriaId) || categoriaId <= 0) {
      this.errores = ['Debe seleccionar una categoría válida'];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isNaN(torneoId) || torneoId <= 0) {
      this.errores = ['Debe seleccionar un torneo válido'];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.loading = true;

    const inscripcionData = {
      nombre: this.inscripcionForm.value.nombre.trim(),
      apellido1: this.inscripcionForm.value.apellido1.trim(),
      apellido2: this.inscripcionForm.value.apellido2?.trim() || null,
      telefono: this.inscripcionForm.value.telefono.replace(/\s/g, ''),
      fecha_nacimiento: fecha_nacimiento,
      idCategoria: categoriaId,
      idTorneo: torneoId,
      notas: this.inscripcionForm.value.notas?.trim() || null
    };

    console.log('Enviando inscripción:', inscripcionData);

    this.inscripcionService.crearInscripcionPublica(inscripcionData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Inscripción exitosa:', response);
        if (response.success) {
          this.mensajeExito = true;
          this.inscripcionForm.reset();
          this.pasoActual = 1;
          this.submitted = false;
          this.categorias = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error completo:', error);

        if (error.error && error.error.errores && Array.isArray(error.error.errores)) {
          this.errores = error.error.errores;
        } else if (error.status === 409) {
          if (error.error && error.error.mensaje) {
            this.errores = [error.error.mensaje];
          } else {
            this.errores = ['Ya existe un registro con estos datos. Por favor, verifica la información.'];
          }
        } else if (error.error && error.error.mensaje) {
          this.errores = [error.error.mensaje];
        } else if (error.status === 0) {
          this.errores = ['No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.'];
        } else if (error.status === 500) {
          this.errores = ['Ocurrió un error en el servidor. Por favor, intenta nuevamente en unos momentos.'];
        } else if (error.status === 400) {
          this.errores = ['Los datos enviados no son válidos. Por favor, revisa la información del formulario.'];
        } else {
          this.errores = ['Error al procesar la inscripción. Por favor, verifica tus datos e intenta nuevamente.'];
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  cerrarMensajeExito(): void {
    this.mensajeExito = false;
    this.costoInscripcion = 0;
    this.categoriaSeleccionada = null;
    this.router.navigate(['/'])
      .catch(error => console.error('Error al navegar:', error));
  }

  formularioTieneDatos(): boolean {
    const values = this.inscripcionForm.value;
    return Object.keys(values).some(key => {
      const value = values[key];
      return value !== null && value !== '' && value !== undefined;
    });
  }

  intentarSalir(): void {
    if (this.formularioTieneDatos()) {
      this.mostrarConfirmacionSalida = true;
    } else {
      this.salir();
    }
  }

  cancelarSalida(): void {
    this.mostrarConfirmacionSalida = false;
  }

  confirmarSalida(): void {
    this.mostrarConfirmacionSalida = false;
    this.salir();
  }

  salir(): void {
    this.router.navigate(['/']);
  }

  get progreso(): number {
    return (this.pasoActual / this.totalPasos) * 100;
  }
}