import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TorneoService } from '../../../services/torneo';
import { InscripcionPublicaService, CategoriaPublica, JugadorSimilar } from '../../../services/inscripcion-publica';
import { Torneo } from '../../../models/torneo';
import { JugadorSimilarComponent } from '../../../componentes/modales/jugador-similar/jugador-similar';

@Component({
  selector: 'app-inscripcion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    JugadorSimilarComponent
  ],
  templateUrl: './inscripcion.html',
  styleUrls: ['./inscripcion.css']
})
export class InscripcionComponent implements OnInit {
  inscripcionForm: FormGroup;
  pasoActual: number = 1;
  totalPasos: number = 3;
  torneos: any[] = [];
  categorias: CategoriaPublica[] = [];
  loading: boolean = false;
  submitted: boolean = false;
  mensajeExito: boolean = false;
  mostrarConfirmacionSalida: boolean = false;
  errores: string[] = [];

  categoriaSeleccionada: CategoriaPublica | null = null;
  costoInscripcion: number = 0;
  torneoIdInicial: number | null = null;
  torneoSlugInicial: string | null = null;
  sistemaPago: any = null;
  torneoActual: any = null;

  // Detección de jugador existente / duplicado (puntos 4, 5, 5.1)
  buscandoJugador: boolean = false;
  mostrarModalSimilares: boolean = false;
  candidatosSimilares: JugadorSimilar[] = [];
  idJugadorSeleccionado: number | null = null;

  dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];
  anios: number[] = [];

  constructor(
    private fb: FormBuilder,
    private torneoService: TorneoService,
    private inscripcionPublicaService: InscripcionPublicaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= anioActual - 100; i--) {
      this.anios.push(i);
    }

    this.inscripcionForm = this.fb.group({
      torneo_id: ['', Validators.required],
      categoria_id: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator]],
      apellido1: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator]],
      apellido2: ['', [Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/), this.telefonoValidator]],
      dia_nacimiento: ['', Validators.required],
      mes_nacimiento: ['', Validators.required],
      anio_nacimiento: ['', Validators.required],
      ya_jugo_antes: [null],
      notas: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.torneoSlugInicial = params['slug'] || null;
      this.cargarTorneosActivos();
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

  // El backend devuelve cierre_inscripciones en snake_case en las listas
  // públicas (getActivos no lo normaliza a camelCase) — aceptar ambos.
  private cierreDeTorneo(torneo: any): string | null {
    return torneo?.cierre_inscripciones ?? torneo?.cierreInscripciones ?? null;
  }

  cargarTorneosActivos(): void {
    this.torneoService.getActivos().subscribe({
      next: (torneos) => {
        this.torneos = (torneos || []).filter(torneo => {
          const cierre = this.cierreDeTorneo(torneo);
          return !cierre || !this.fechaYaPaso(cierre);
        });

        if (this.torneos.length === 0) {
          this.errores = ['No hay torneos disponibles con inscripciones abiertas en este momento'];
        } else if (this.torneoSlugInicial) {
          const torneoEncontrado = this.torneos.find(t => t.slug === this.torneoSlugInicial);

          if (torneoEncontrado && torneoEncontrado.idTorneo) {
            this.torneoIdInicial = torneoEncontrado.idTorneo;
            this.inscripcionForm.patchValue({ torneo_id: torneoEncontrado.idTorneo });
            this.onTorneoChange(torneoEncontrado.idTorneo);
          } else {
            this.errores = ['El torneo seleccionado ya no tiene inscripciones abiertas'];
          }
        }
      },
      error: () => {
        this.errores = ['Error al cargar los torneos disponibles'];
      }
    });
  }

  onTorneoChange(idTorneoRaw: number | string): void {
    const idTorneo = Number(idTorneoRaw);

    this.inscripcionForm.patchValue({ categoria_id: '' });
    this.categoriaSeleccionada = null;
    this.costoInscripcion = 0;

    if (!idTorneo || isNaN(idTorneo) || idTorneo <= 0) {
      this.categorias = [];
      this.sistemaPago = null;
      this.torneoActual = null;
      return;
    }

    const torneoSeleccionado = this.torneos.find(t => t.idTorneo === idTorneo);
    this.torneoActual = torneoSeleccionado || null;
    this.sistemaPago = torneoSeleccionado?.sistema_pago || torneoSeleccionado?.sistemaPago || null;

    this.loading = true;
    this.errores = [];

    this.inscripcionPublicaService.obtenerCategorias(idTorneo).subscribe({
      next: (categorias) => {
        this.loading = false;
        this.categorias = categorias || [];
        if (this.categorias.length === 0) {
          this.errores = ['Este torneo no tiene categorías disponibles'];
        }
      },
      error: () => {
        this.loading = false;
        this.categorias = [];
        this.errores = ['Error al cargar las categorías del torneo'];
      }
    });
  }

  onTorneoSelectChange(event: any): void {
    this.onTorneoChange(event.target.value);
  }

  onCategoriaChange(event: any): void {
    const categoriaId = Number(event.target.value);
    this.categoriaSeleccionada = this.categorias.find(c => c.idCategoria === categoriaId) || null;
    this.costoInscripcion = this.categoriaSeleccionada?.costo || 0;
  }

  puedeElegirCategoria(cat: CategoriaPublica): boolean {
    return !cat.cerrada && !cat.llena;
  }

  motivoCategoriaDeshabilitada(cat: CategoriaPublica): string {
    if (cat.cerrada) return 'Inscripciones cerradas';
    if (cat.llena) return 'Cupo lleno';
    return '';
  }

  // ── Validación por paso ────────────────────────────────────

  validarPasoActual(): boolean {
    this.errores = [];

    switch (this.pasoActual) {
      case 1:
        return this.validarCampos(['torneo_id', 'categoria_id']);
      case 2:
        return this.validarCampos(['nombre', 'apellido1', 'apellido2', 'telefono']) && this.validarFechaNacimiento();
      case 3:
        return true;
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
    if (fecha.getDate() !== parseInt(dia) || fecha.getMonth() !== parseInt(mes) - 1 || fecha.getFullYear() !== parseInt(anio)) {
      this.errores.push('La fecha de nacimiento no es válida');
      return false;
    }
    if (fecha > new Date()) {
      this.errores.push('La fecha de nacimiento no puede ser futura');
      return false;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    if (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())) {
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
          if (control.errors['required']) this.errores.push(`El campo ${this.getNombreCampo(campo)} es obligatorio`);
          if (control.errors['minlength']) this.errores.push(`${this.getNombreCampo(campo)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`);
          if (control.errors['maxlength']) this.errores.push(`${this.getNombreCampo(campo)} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres`);
          if (control.errors['soloLetras']) this.errores.push(`${this.getNombreCampo(campo)} solo puede contener letras`);
          if (control.errors['pattern'] || control.errors['telefonoInvalido']) this.errores.push('El teléfono debe tener exactamente 10 dígitos');
        }
      }
    });
    return valido;
  }

  getNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      nombre: 'Nombre', apellido1: 'Primer apellido', apellido2: 'Segundo apellido',
      telefono: 'Teléfono', torneo_id: 'Torneo', categoria_id: 'Categoría'
    };
    return nombres[campo] || campo;
  }

  // ── Navegación entre pasos ──────────────────────────────────

  siguientePaso(): void {
    this.submitted = true;
    if (!this.validarPasoActual()) {
      // En móvil (o cualquier pantalla donde el formulario se desplace hacia
      // abajo) el banner de errores queda arriba, fuera de vista, si no se
      // regresa el scroll al inicio.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (this.pasoActual === 2) {
      // Punto 4/5: siempre se busca, sin importar la respuesta a "¿ya jugaste antes?"
      this.buscarPosiblesDuplicados();
      return;
    }

    this.pasoActual++;
    this.submitted = false;
  }

  private buscarPosiblesDuplicados(): void {
    const nombre = this.inscripcionForm.value.nombre?.trim();
    const apellido1 = this.inscripcionForm.value.apellido1?.trim();
    if (!nombre || !apellido1) {
      this.pasoActual++;
      this.submitted = false;
      return;
    }

    this.buscandoJugador = true;
    this.inscripcionPublicaService.buscarJugador(`${nombre} ${apellido1}`).subscribe({
      next: (candidatos) => {
        this.buscandoJugador = false;
        if (candidatos && candidatos.length > 0) {
          this.candidatosSimilares = candidatos;
          this.mostrarModalSimilares = true;
        } else {
          this.pasoActual++;
          this.submitted = false;
        }
      },
      error: () => {
        // Si la búsqueda falla, no bloquear el flujo — se sigue validando
        // duplicados exactos en el backend al momento de inscribir.
        this.buscandoJugador = false;
        this.pasoActual++;
        this.submitted = false;
      }
    });
  }

  onSeleccionarSimilar(jugador: JugadorSimilar): void {
    this.idJugadorSeleccionado = jugador.idJugador;
    this.mostrarModalSimilares = false;

    if (jugador.fecha_nacimiento) {
      const f = new Date(jugador.fecha_nacimiento);
      this.inscripcionForm.patchValue({
        dia_nacimiento: f.getUTCDate(),
        mes_nacimiento: f.getUTCMonth() + 1,
        anio_nacimiento: f.getUTCFullYear()
      });
    }

    this.pasoActual++;
    this.submitted = false;
  }

  onNingunoDeEstos(): void {
    this.idJugadorSeleccionado = null;
    this.mostrarModalSimilares = false;
    this.pasoActual++;
    this.submitted = false;
  }

  pasoAnterior(): void {
    if (this.pasoActual > 1) {
      this.pasoActual--;
      this.errores = [];
    }
  }

  // ── Envío final ──────────────────────────────────────────────

  onSubmit(): void {
    this.submitted = true;
    this.errores = [];

    const torneoId = Number(this.inscripcionForm.value.torneo_id);
    const categoriaId = Number(this.inscripcionForm.value.categoria_id);

    if (!torneoId || !categoriaId) {
      this.errores = ['Faltan datos del torneo o la categoría'];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const dia = String(this.inscripcionForm.value.dia_nacimiento).padStart(2, '0');
    const mes = String(this.inscripcionForm.value.mes_nacimiento).padStart(2, '0');
    const anio = this.inscripcionForm.value.anio_nacimiento;
    const fecha_nacimiento = `${anio}-${mes}-${dia}`;

    this.loading = true;

    const payload = {
      idJugador: this.idJugadorSeleccionado ?? undefined,
      nombre: this.inscripcionForm.value.nombre.trim(),
      apellido1: this.inscripcionForm.value.apellido1.trim(),
      apellido2: this.inscripcionForm.value.apellido2?.trim() || undefined,
      telefono: this.inscripcionForm.value.telefono.replace(/\s/g, ''),
      fecha_nacimiento,
      idTorneo: torneoId,
      idCategoria: categoriaId,
      notas: this.inscripcionForm.value.notas?.trim() || undefined
    };

    this.inscripcionPublicaService.crear(payload).subscribe({
      next: () => {
        this.loading = false;
        this.mensajeExito = true;
        this.inscripcionForm.reset();
        this.pasoActual = 1;
        this.submitted = false;
        this.categorias = [];
        this.idJugadorSeleccionado = null;
      },
      error: (error) => {
        this.loading = false;

        if (error.error?.errores && Array.isArray(error.error.errores)) {
          this.errores = error.error.errores;
        } else if (error.error?.mensaje) {
          this.errores = [error.error.mensaje];
        } else if (error.status === 0) {
          this.errores = ['No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.'];
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
    this.sistemaPago = null;
    this.router.navigate(['/']);
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

  formatearClabe(clabe: string): string {
    if (!clabe) return '';
    return clabe.replace(/(\d{3})(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5');
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    const numeros = telefono.replace(/\D/g, '');
    if (numeros.length === 10) {
      return numeros.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return telefono;
  }

  soloDigitos(telefono: string): string {
    return telefono ? telefono.replace(/\D/g, '') : '';
  }

  private fechaYaPaso(fechaCierre: string | Date): boolean {
    try {
      const fechaCierreStr = typeof fechaCierre === 'string' ? fechaCierre : fechaCierre.toISOString();
      const [datePart, timePart] = fechaCierreStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = (timePart || '00:00').split(':').map(Number);
      const fecha = new Date(year, month - 1, day, hour, minute);
      return new Date() >= fecha;
    } catch {
      return false;
    }
  }
}
