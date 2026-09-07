import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { Torneo } from '../../../../models/torneo';
import { TorneoCategoriaService } from '../../../../services/torneo-categoria';
import { CategoriaService } from '../../../../services/categoria';
import { RitmoJuegoService } from '../../../../services/ritmo-juego';
import { SistemaCompetenciaService } from '../../../../services/sistema-competencia';
import { SistemaDesempateService } from '../../../../services/sistema-desempates';
import { SistemaPagoService } from '../../../../services/sistema-pago';

import { SistemaPago } from '../../../../models/sistema-pago';
import { Categoria } from '../../../../models/categoria';
import { RitmoJuego } from '../../../../models/ritmo-juego';
import { SistemaCompetencia } from '../../../../models/sistema-competencia';
import { SistemaDesempate } from '../../../../models/sistema-desempates';

import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { DatetimeInputComponent } from '../../../../componentes/atoms/datetime-input/datetime-input';
import { ConfirmarPasswordComponent } from '../../../../componentes/modales/confirmar-password/confirmar-password';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

@Component({
  selector: 'app-nuevo-torneo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    PageHeaderComponent, ButtonComponent, IconButtonComponent, IconComponent, DatetimeInputComponent,
    ConfirmarPasswordComponent, ToastNoti
  ],
  templateUrl: './nuevo-torneo.html',
  styleUrls: ['./nuevo-torneo.css']
})
export class NuevoTorneoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneoForm: FormGroup;

  mostrarModalPublicar = false;
  publicando = false;
  errorPublicar = '';
  torneoCreadoPendiente: Torneo | null = null;

  // Catálogos
  categorias: Categoria[] = [];
  ritmosJuego: RitmoJuego[] = [];
  sistemasCompetencia: SistemaCompetencia[] = [];
  sistemasDesempate: SistemaDesempate[] = [];
  sistemasPago: SistemaPago[] = [];

  // UI State
  categoriasSeleccionadas: number[] = [];
  categoriasExpandidas: number[] = []; // NUEVO: Para controlar qué categorías están expandidas
  seccionesAbiertas = {
    informacionGeneral: true,
    categorias: true,
    configuracionAdicional: true,
    notas: true
  };

  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private torneoService: TorneoService,
    private authService: AuthService,
    private torneoCategoriaService: TorneoCategoriaService,
    private categoriaService: CategoriaService,
    private ritmoJuegoService: RitmoJuegoService,
    private sistemaCompetenciaService: SistemaCompetenciaService,
    private sistemaDesempateService: SistemaDesempateService,
    private sistemaPagoService: SistemaPagoService
  ) {
    this.torneoForm = this.fb.group({
      nombre: ['', Validators.required],
      lugar: ['', Validators.required],
      direccion: ['', Validators.required],
      url_maps: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      cierreInscripciones: ['', Validators.required],
      idSistemaPago: [null],
      tiempoEspera: [10, [Validators.min(0)]],
      permitirByePrimeraRonda: [true],
      notas: [''],
      configuracionCategorias: this.fb.array([])
    }, { validators: this.cierreAntesDelTorneoValidator.bind(this) });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.categoriaService.getAll().subscribe(data => this.categorias = data);
    this.ritmoJuegoService.getAll(true).subscribe(data => this.ritmosJuego = data);
    this.sistemaCompetenciaService.getAll(true).subscribe(data => this.sistemasCompetencia = data);
    this.sistemaDesempateService.getAll(true).subscribe(data => this.sistemasDesempate = data);
    this.sistemaPagoService.getAll(true).subscribe(data => this.sistemasPago = data);
  }

  get configuracionCategorias(): FormArray {
    return this.torneoForm.get('configuracionCategorias') as FormArray;
  }

  toggleCategoria(idCategoria: number): void {
    const index = this.categoriasSeleccionadas.indexOf(idCategoria);

    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
      const configIndex = this.configuracionCategorias.controls.findIndex(
        c => c.get('idCategoria')?.value === idCategoria
      );
      if (configIndex > -1) {
        this.configuracionCategorias.removeAt(configIndex);
      }
      // Remover de expandidas también
      const expandedIndex = this.categoriasExpandidas.indexOf(idCategoria);
      if (expandedIndex > -1) {
        this.categoriasExpandidas.splice(expandedIndex, 1);
      }
    } else {
      this.categoriasSeleccionadas.push(idCategoria);
      this.agregarConfiguracionCategoria(idCategoria);
      // Expandir automáticamente la nueva categoría
      this.categoriasExpandidas.push(idCategoria);
    }
  }

  isCategoriaSeleccionada(idCategoria: number): boolean {
    return this.categoriasSeleccionadas.includes(idCategoria);
  }

  // NUEVO: Función para verificar si una categoría está expandida
  isCategoriaExpandida(idCategoria: number): boolean {
    return this.categoriasExpandidas.includes(idCategoria);
  }

  // NUEVO: Función para toggle expandir/colapsar categoría
  toggleCategoriaExpandida(idCategoria: number): void {
    const index = this.categoriasExpandidas.indexOf(idCategoria);
    if (index > -1) {
      this.categoriasExpandidas.splice(index, 1);
    } else {
      this.categoriasExpandidas.push(idCategoria);
    }
  }

  agregarConfiguracionCategoria(idCategoria: number): void {
    const config = this.fb.group({
      idCategoria: [idCategoria],
      rondas: [5, [Validators.required, Validators.min(1)]],
      ritmoJuego: ['', Validators.required],
      sistemaCompetencia: ['', Validators.required],
      calendario: this.fb.array([]),
      premios: this.fb.array([
        this.crearPremio('Primer Lugar', 0),
        this.crearPremio('Segundo Lugar', 0),
        this.crearPremio('Tercer Lugar', 0)
      ]),
      desempates: [[...this.desempatesGlobales]] // Copiar desempates globales
    });

    // Crear calendario inicial
    const numRondas = config.get('rondas')?.value || 5;
    this.actualizarCalendario(config, numRondas);

    this.configuracionCategorias.push(config);

    // Listener para actualizar calendario cuando cambien las rondas
    config.get('rondas')?.valueChanges.subscribe(rondas => {
      if (typeof rondas === 'number' && rondas > 0) {
        this.actualizarCalendario(config, rondas);
      }
    });
  }

  crearPremio(descripcion: string, monto: number): FormGroup {
    return this.fb.group({
      descripcion: [descripcion],
      monto: [monto, [Validators.min(0)]]
    });
  }

  actualizarCalendario(config: FormGroup, numRondas: number): void {
    const calendario = config.get('calendario') as FormArray;
    const currentLength = calendario.length;

    if (numRondas > currentLength) {
      for (let i = currentLength; i < numRondas; i++) {
        calendario.push(this.crearRonda(i + 1));
      }
    } else if (numRondas < currentLength) {
      for (let i = currentLength - 1; i >= numRondas; i--) {
        calendario.removeAt(i);
      }
    }
  }

  crearRonda(numero: number): FormGroup {
    return this.fb.group({
      numero: [numero],
      fecha: ['']
    });
  }

  getCalendario(configIndex: number): FormArray {
    return this.configuracionCategorias.at(configIndex).get('calendario') as FormArray;
  }

  getPremios(configIndex: number): FormArray {
    return this.configuracionCategorias.at(configIndex).get('premios') as FormArray;
  }

  agregarPremio(configIndex: number): void {
    const premios = this.getPremios(configIndex);
    const nextLugar = premios.length + 1;
    let descripcion = '';

    if (nextLugar === 4) {
      descripcion = 'Cuarto Lugar';
    } else if (nextLugar === 5) {
      descripcion = 'Quinto Lugar';
    } else {
      descripcion = `Lugar ${nextLugar}`;
    }

    premios.push(this.crearPremio(descripcion, 0));
  }

  eliminarPremio(configIndex: number, premioIndex: number): void {
    const premios = this.getPremios(configIndex);
    if (premios.length > 1) {
      premios.removeAt(premioIndex);
    }
  }

  // Desempates globales (aplicados a todas las categorías)
  desempatesGlobales: number[] = [];

  toggleDesempate(configIndex: number | null, sistemaId: number): void {
    // Si configIndex es null, usar desempates globales
    if (configIndex === null) {
      const index = this.desempatesGlobales.indexOf(sistemaId);
      if (index > -1) {
        this.desempatesGlobales.splice(index, 1);
      } else {
        this.desempatesGlobales.push(sistemaId);
      }

      // Aplicar a todas las categorías existentes
      this.configuracionCategorias.controls.forEach(config => {
        config.patchValue({ desempates: [...this.desempatesGlobales] });
      });
    } else {
      const config = this.configuracionCategorias.at(configIndex);
      const desempates = config.get('desempates')?.value || [];
      const index = desempates.indexOf(sistemaId);

      if (index > -1) {
        desempates.splice(index, 1);
      } else {
        desempates.push(sistemaId);
      }

      config.patchValue({ desempates });
    }
  }

  isDesempateSeleccionado(configIndex: number | null, sistemaId: number): boolean {
    if (configIndex === null) {
      return this.desempatesGlobales.includes(sistemaId);
    }

    const config = this.configuracionCategorias.at(configIndex);
    const desempates = config.get('desempates')?.value || [];
    return desempates.includes(sistemaId);
  }

  getPrioridadDesempate(configIndex: number | null, sistemaId: number): number {
    if (configIndex === null) {
      const index = this.desempatesGlobales.indexOf(sistemaId);
      return index > -1 ? index + 1 : 0;
    }

    const config = this.configuracionCategorias.at(configIndex);
    const desempates = config.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);
    return index > -1 ? index + 1 : 0;
  }

  getNombreCategoria(idCategoria: number): string {
    return this.categorias.find(c => c.idCategoria === idCategoria)?.nombre || '';
  }

  getCostoCategoria(idCategoria: number): number {
    return this.categorias.find(c => c.idCategoria === idCategoria)?.costo || 0;
  }

  toggleSeccion(seccion: keyof typeof this.seccionesAbiertas): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  /**
   * Lo mínimo que la BD exige para crear el torneo: lugar, dirección y fecha
   * son NOT NULL en la tabla Torneo (no se puede omitir sin migración).
   * hora_inicio/hora_fin sí son nullable, y todo lo demás (nombre,
   * categorías, ritmo/sistema, desempates) puede quedar incompleto en un
   * borrador — solo se exige completo al publicar.
   */
  get datosMinimosCompletos(): boolean {
    const f = this.torneoForm;
    return !!(
      f.get('lugar')?.value?.trim() &&
      f.get('direccion')?.value?.trim() &&
      f.get('fecha')?.value
    );
  }

  /** Valida el formulario y crea el torneo + sus categorías. Devuelve null (con `error` seteado) si la validación falla. */
  private async crearTorneoYCategorias(modo: 'borrador' | 'publicar'): Promise<Torneo | null> {
    if (modo === 'publicar') {
      if (this.torneoForm.invalid || this.categoriasSeleccionadas.length === 0) {
        this.error = 'Por favor complete todos los campos requeridos y seleccione al menos una categoría';
        return null;
      }
      if (this.desempatesGlobales.length < 2) {
        this.error = 'Debe seleccionar al menos 2 sistemas de desempate';
        return null;
      }
    } else if (!this.datosMinimosCompletos) {
      this.error = 'Completa al menos lugar, dirección, fecha y horarios para guardar el borrador';
      return null;
    }

    this.error = null;
    const formValue = this.torneoForm.value;

    // Crear el torneo principal con los campos correctos
    const torneoData = {
      nombre: formValue.nombre,
      lugar: formValue.lugar,
      direccion: formValue.direccion,
      // undefined (no null/vacío): el backend valida url_maps y cierre_inscripciones
      // con validadores de formato que aceptan ausencia del campo pero no cadena vacía.
      url_maps: formValue.url_maps || undefined,
      fecha: formValue.fecha,
      hora_inicio: formValue.hora_inicio || undefined,
      hora_fin: formValue.hora_fin || undefined,
      cierre_inscripciones: formValue.cierreInscripciones || undefined,
      idSistemaPago: formValue.idSistemaPago || null,
      notas: formValue.notas || null,
      rondas: formValue.configuracionCategorias.length > 0
        ? Math.max(...formValue.configuracionCategorias.map((c: any) => c.rondas))
        : 5,
      categorias: this.categoriasSeleccionadas.map(id => this.getNombreCategoria(id)),
      activo: true
    };

    const torneoCreado = await this.torneoService.create(torneoData).toPromise();

    if (!torneoCreado?.idTorneo) {
      throw new Error('No se pudo crear el torneo');
    }

    // Crear las configuraciones de categorías
    for (const config of formValue.configuracionCategorias) {
      const premiosObj: any = {};
      config.premios.forEach((p: any, idx: number) => {
        const descripcion = p.descripcion || `Lugar ${idx + 1}`;
        const monto = p.monto || '0';
        premiosObj[idx + 1] = `${monto} - ${descripcion}`;
      });

      const categoriaData = {
        idTorneo: torneoCreado.idTorneo,
        idCategoria: config.idCategoria,
        rondas: config.rondas,
        ritmo_juego: config.ritmoJuego || null,
        sistema_competencia: config.sistemaCompetencia || null,
        calendario: config.calendario.map((ronda: any) => ({
          numero: ronda.numero,
          fecha: ronda.fecha || null
        })),
        premios: premiosObj,
        desempates: config.desempates.map((id: number) =>
          this.sistemasDesempate.find(s => s.idDesempate === id)?.nombre || ''
        ),
        activo: true
      };

      await this.torneoCategoriaService.upsert(categoriaData).toPromise();
    }

    return torneoCreado;
  }

  /** Crea el torneo y se queda en estado borrador — lleva a la vista de revisión/publicación. */
  async guardarComoBorrador(): Promise<void> {
    this.loading = true;
    try {
      const torneoCreado = await this.crearTorneoYCategorias('borrador');
      if (!torneoCreado) return;
      this.router.navigate(['/main-view/editar-torneo', torneoCreado.slug]);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al crear el torneo';
      this.toast.error('No se pudo guardar el borrador', this.error ?? undefined);
      console.error('Error completo:', err);
    } finally {
      this.loading = false;
    }
  }

  /** Crea el torneo y, tras confirmar contraseña, lo publica de inmediato. */
  async guardarYPublicar(): Promise<void> {
    this.loading = true;
    try {
      const torneoCreado = await this.crearTorneoYCategorias('publicar');
      if (!torneoCreado) return;
      this.torneoCreadoPendiente = torneoCreado;
      this.mostrarModalPublicar = true;
    } catch (err: any) {
      this.error = err.error?.message || 'Error al crear el torneo';
      this.toast.error('No se pudo crear el torneo', this.error ?? undefined);
      console.error('Error completo:', err);
    } finally {
      this.loading = false;
    }
  }

  confirmarPublicacionInicial(password: string): void {
    if (!this.torneoCreadoPendiente?.idTorneo) return;
    const torneo = this.torneoCreadoPendiente;

    this.publicando = true;
    this.errorPublicar = '';

    this.authService.verificarPassword(password).subscribe({
      next: () => {
        this.torneoService.cambiarEstado(torneo.idTorneo!, 'publicado').subscribe({
          next: () => {
            this.publicando = false;
            this.mostrarModalPublicar = false;
            this.torneoCreadoPendiente = null;
            this.toast.success('Torneo publicado', 'El torneo se creó y publicó correctamente');
            this.router.navigate(['/main-view/torneos']);
          },
          error: (error) => {
            this.publicando = false;
            this.mostrarModalPublicar = false;
            this.torneoCreadoPendiente = null;
            this.toast.error('Guardado como borrador', error.error?.message || 'El torneo se creó pero no se pudo publicar');
            this.router.navigate(['/main-view/editar-torneo', torneo.slug]);
          }
        });
      },
      error: () => {
        this.publicando = false;
        this.errorPublicar = 'Contraseña incorrecta';
      }
    });
  }

  cancelarPublicacionInicial(): void {
    this.mostrarModalPublicar = false;
    const torneo = this.torneoCreadoPendiente;
    this.torneoCreadoPendiente = null;
    if (torneo?.slug) {
      this.toast.success('Guardado como borrador', 'El torneo quedó guardado como borrador');
      this.router.navigate(['/main-view/editar-torneo', torneo.slug]);
    }
  }

  private cierreAntesDelTorneoValidator(formGroup: AbstractControl): ValidationErrors | null {
    const fechaControl = formGroup.get('fecha');
    const horaControl = formGroup.get('hora_inicio');
    const cierreControl = formGroup.get('cierreInscripciones');

    if (!fechaControl || !horaControl || !cierreControl) {
      return null;
    }

    const fecha = fechaControl.value;
    const hora = horaControl.value;
    const cierre = cierreControl.value;

    if (!fecha || !hora || !cierre) {
      return null;
    }

    // Combinar fecha y hora del torneo
    const fechaTorneo = new Date(`${fecha}T${hora}`);
    const fechaCierre = new Date(cierre);

    if (fechaCierre >= fechaTorneo) {
      return { cierreDebeSerAntes: true };
    }

    return null;
  }

  get errorCierreInscripciones(): string | null {
    if (this.torneoForm.errors?.['cierreDebeSerAntes'] &&
      this.torneoForm.get('cierreInscripciones')?.touched) {
      return 'El cierre de inscripciones debe ser antes de la fecha y hora del torneo';
    }
    return null;
  }

  cancelar(): void {
    this.router.navigate(['/main-view/torneos']);
  }
}
