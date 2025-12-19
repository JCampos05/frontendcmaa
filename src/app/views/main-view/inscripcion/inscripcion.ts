import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { InscripcionService } from '../../../services/inscripcion/inscripcion';
import { TorneoService } from '../../../services/torneo/torneo';
import { TorneoCategoriaService } from '../../../services/torneo-categoria/torneo-categoria';

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

  // Arrays para los selectores de fecha
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
    private torneoCategoriaService: TorneoCategoriaService
  ) {
    // Generar años (desde hace 100 años hasta el año actual)
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= anioActual - 100; i--) {
      this.anios.push(i);
    }

    this.inscripcionForm = this.fb.group({
      // Paso 1: Datos personales
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

      // Paso 2: Datos de contacto
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^\d{10}$/),
        this.telefonoValidator
      ]],

      // Paso 3: Fecha de nacimiento
      dia_nacimiento: ['', Validators.required],
      mes_nacimiento: ['', Validators.required],
      anio_nacimiento: ['', Validators.required],

      // Paso 4: Torneo y categoría
      torneo_id: ['', Validators.required],
      categoria_id: ['', Validators.required],
      notas: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.cargarTorneosActivos();
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
        this.torneos = torneos || [];
      },
      error: (error) => {
        //console.error('Error al cargar torneos:', error);
        this.errores = ['Error al cargar los torneos disponibles'];
      }
    });
  }

  onTorneoChange(event: any): void {
    const torneoId = event.target.value;

    if (torneoId && torneoId !== '' && torneoId !== null) {
      const torneoIdNumero = Number(torneoId);

      if (isNaN(torneoIdNumero) || torneoIdNumero <= 0) {
        //console.error('El ID del torneo no es válido:', torneoId);
        this.errores = ['Error al seleccionar el torneo. Por favor, intente nuevamente.'];
        this.categorias = [];
        return;
      }

      this.loading = true;
      this.errores = [];

      this.torneoCategoriaService.getByTorneo(torneoIdNumero).subscribe({
        next: (torneosCategorias) => {
          this.loading = false;

          // Mapear para extraer las categorías con su información completa
          this.categorias = torneosCategorias
            .filter(tc => tc.activo !== false && tc.categoria)
            .map(tc => ({
              idCategoria: tc.idCategoria,
              nombre: tc.categoria!.nombre,
              costo: tc.categoria!.costo,
              nota: tc.categoria!.nota
            }));

          //console.log('Categorías cargadas:', this.categorias);

          if (this.categorias.length === 0) {
            this.errores = ['Este torneo no tiene categorías disponibles'];
          }
        },
        error: (error) => {
          this.loading = false;
          //console.error('Error al cargar categorías:', error);
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

    if (categoriaId && categoriaId !== '' && this.categorias.length > 0) {
      const categoriaIdNumero = Number(categoriaId);
      this.categoriaSeleccionada = this.categorias.find(cat => cat.idCategoria === categoriaIdNumero);

      if (this.categoriaSeleccionada) {
        this.costoInscripcion = this.categoriaSeleccionada.costo || 0;
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

    // Validar que la fecha sea válida
    const fecha = new Date(anio, mes - 1, dia);
    if (fecha.getDate() !== parseInt(dia) ||
      fecha.getMonth() !== parseInt(mes) - 1 ||
      fecha.getFullYear() !== parseInt(anio)) {
      this.errores.push('La fecha de nacimiento no es válida');
      return false;
    }

    // Validar que no sea una fecha futura
    if (fecha > new Date()) {
      this.errores.push('La fecha de nacimiento no puede ser futura');
      return false;
    }

    // Validar edad mínima (5 años)
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

    // Construir fecha de nacimiento en formato ISO (YYYY-MM-DD)
    const dia = String(this.inscripcionForm.value.dia_nacimiento).padStart(2, '0');
    const mes = String(this.inscripcionForm.value.mes_nacimiento).padStart(2, '0');
    const anio = this.inscripcionForm.value.anio_nacimiento;
    const fecha_nacimiento = `${anio}-${mes}-${dia}`;

    // Obtener los IDs como números
    const categoriaId = Number(this.inscripcionForm.value.categoria_id);
    const torneoId = Number(this.inscripcionForm.value.torneo_id);

    // Validar que los IDs sean válidos
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

    // IMPORTANTE: El backend espera idCategoria e idTorneo (camelCase)
    const inscripcionData = {
      nombre: this.inscripcionForm.value.nombre.trim(),
      apellido1: this.inscripcionForm.value.apellido1.trim(),
      apellido2: this.inscripcionForm.value.apellido2?.trim() || null,
      telefono: this.inscripcionForm.value.telefono.replace(/\s/g, ''),
      fecha_nacimiento: fecha_nacimiento,
      idCategoria: categoriaId,  // Cambio: usar idCategoria
      idTorneo: torneoId,        // Cambio: usar idTorneo
      notas: this.inscripcionForm.value.notas?.trim() || null
    };


    this.inscripcionService.crearInscripcionPublica(inscripcionData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.mensajeExito = true;
          this.inscripcionForm.reset();
          this.pasoActual = 1;
          this.submitted = false;
          this.categorias = [];
          // Mantener el costo para mostrarlo en el modal
          // No resetear: costoInscripcion y categoriaSeleccionada
        }
      },
      error: (error) => {
        this.loading = false;
        //console.error('Error completo:', error);

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
    // Resetear el costo y categoría seleccionada
    this.costoInscripcion = 0;
    this.categoriaSeleccionada = null;
  }

  // Verificar si hay datos en el formulario
  formularioTieneDatos(): boolean {
    const values = this.inscripcionForm.value;
    return Object.keys(values).some(key => {
      const value = values[key];
      return value !== null && value !== '' && value !== undefined;
    });
  }

  // Intentar salir
  intentarSalir(): void {
    if (this.formularioTieneDatos()) {
      this.mostrarConfirmacionSalida = true;
    } else {
      this.salir();
    }
  }

  // Cancelar salida
  cancelarSalida(): void {
    this.mostrarConfirmacionSalida = false;
  }

  // Confirmar salida
  confirmarSalida(): void {
    this.mostrarConfirmacionSalida = false;
    this.salir();
  }

  // Salir (navegar hacia atrás o a home)
  salir(): void {
    // Aquí puedes usar el router para navegar
    // this.router.navigate(['/home']);
    // O simplemente:
    window.history.back();
  }

  get progreso(): number {
    return (this.pasoActual / this.totalPasos) * 100;
  }
}