import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { InfoLigaService } from '../../../services/infoLiga/info-liga';
import { GrupoLigaService } from '../../../services/grupoLiga/grupo-liga';
import { RitmoJuegoService } from '../../../services/ritmo-juego/ritmo-juego';
import { SistemaDesempateService } from '../../../services/sistema-desempates/sistema-desempates';

import { RitmoJuego } from '../../../models/ritmo-juego';
import { SistemaDesempate } from '../../../models/sistema-desempates';

@Component({
  selector: 'app-nueva-liga',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-liga.html',
  styleUrls: ['./nueva-liga.css']
})
export class NuevaLigaComponent implements OnInit {
  ligaForm: FormGroup;

  // Catálogos
  ritmosJuego: RitmoJuego[] = [];
  sistemasDesempate: SistemaDesempate[] = [];

  // UI State
  seccionesAbiertas = {
    informacionGeneral: true,
    grupos: true,
    configuracionAdicional: true,
    notas: true
  };

  loading = false;
  error: string | null = null;

  tiposSistema = [
    { value: 'round_robin', label: 'Round Robin (todos contra todos)' },
    { value: 'suizo', label: 'Sistema Suizo' },
    { value: 'grupos', label: 'Sistema de Grupos' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService,
    private ritmoJuegoService: RitmoJuegoService,
    private sistemaDesempateService: SistemaDesempateService
  ) {
    this.ligaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      fecha_inicio: ['', Validators.required],
      fecha_fin: [''],
      lugar: ['', Validators.required],
      direccion: [''],
      tipo_sistema: ['grupos', Validators.required],
      num_grupos: [1, [Validators.required, Validators.min(1)]],
      clasifican_por_grupo: [2, [Validators.required, Validators.min(1)]],
      idRitmoJuego: [null],
      costo_inscripcion: [0, [Validators.min(0)]],
      cierre_inscripciones: [''],
      max_jugadores: [null],
      notas: [''],
      grupos: this.fb.array([])
    }, { validators: this.cierreAntesDelInicioValidator.bind(this) });

    // Listener para cambios en num_grupos
    this.ligaForm.get('num_grupos')?.valueChanges.subscribe(numGrupos => {
      this.actualizarGrupos(numGrupos);
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.actualizarGrupos(1); // Inicializar con 1 grupo
  }

  cargarCatalogos(): void {
    this.ritmoJuegoService.getAll(true).subscribe(data => this.ritmosJuego = data);
    this.sistemaDesempateService.getAll(true).subscribe(data => this.sistemasDesempate = data);
  }

  get grupos(): FormArray {
    return this.ligaForm.get('grupos') as FormArray;
  }

  actualizarGrupos(numGrupos: number): void {
    const currentLength = this.grupos.length;

    if (numGrupos > currentLength) {
      for (let i = currentLength; i < numGrupos; i++) {
        this.grupos.push(this.crearGrupo(i + 1));
      }
    } else if (numGrupos < currentLength) {
      for (let i = currentLength - 1; i >= numGrupos; i--) {
        this.grupos.removeAt(i);
      }
    }
  }

  crearGrupo(numero: number): FormGroup {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return this.fb.group({
      nombre: [`Grupo ${letras[numero - 1] || numero}`, Validators.required],
      descripcion: [''],
      max_jugadores: [null],
      rondas: [5, [Validators.required, Validators.min(1)]],
      premios: this.fb.array([
        this.crearPremio('Primer Lugar'),
        this.crearPremio('Segundo Lugar'),
        this.crearPremio('Tercer Lugar')
      ]),
      desempates: [[]]
    });
  }

  crearPremio(descripcion: string): FormGroup {
    return this.fb.group({
      descripcion: [descripcion],
      monto: ['']
    });
  }

  getPremios(grupoIndex: number): FormArray {
    return this.grupos.at(grupoIndex).get('premios') as FormArray;
  }

  agregarPremio(grupoIndex: number): void {
    const premios = this.getPremios(grupoIndex);
    const nextLugar = premios.length + 1;
    let descripcion = '';

    if (nextLugar === 4) {
      descripcion = 'Cuarto Lugar';
    } else if (nextLugar === 5) {
      descripcion = 'Quinto Lugar';
    } else {
      descripcion = `Lugar ${nextLugar}`;
    }

    premios.push(this.crearPremio(descripcion));
  }

  eliminarPremio(grupoIndex: number, premioIndex: number): void {
    const premios = this.getPremios(grupoIndex);
    if (premios.length > 1) {
      premios.removeAt(premioIndex);
    }
  }

  toggleDesempate(grupoIndex: number, sistemaId: number): void {
    const grupo = this.grupos.at(grupoIndex);
    const desempates = grupo.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);

    if (index > -1) {
      desempates.splice(index, 1);
    } else {
      desempates.push(sistemaId);
    }

    grupo.patchValue({ desempates });
  }

  isDesempateSeleccionado(grupoIndex: number, sistemaId: number): boolean {
    const grupo = this.grupos.at(grupoIndex);
    const desempates = grupo.get('desempates')?.value || [];
    return desempates.includes(sistemaId);
  }

  getPrioridadDesempate(grupoIndex: number, sistemaId: number): number {
    const grupo = this.grupos.at(grupoIndex);
    const desempates = grupo.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);
    return index > -1 ? index + 1 : 0;
  }

  toggleSeccion(seccion: keyof typeof this.seccionesAbiertas): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  private cierreAntesDelInicioValidator(formGroup: AbstractControl): ValidationErrors | null {
    const fechaInicioControl = formGroup.get('fecha_inicio');
    const cierreControl = formGroup.get('cierre_inscripciones');

    if (!fechaInicioControl || !cierreControl) {
      return null;
    }

    const fechaInicio = fechaInicioControl.value;
    const cierre = cierreControl.value;

    if (!fechaInicio || !cierre) {
      return null;
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaCierre = new Date(cierre);

    if (fechaCierre >= fechaInicioDate) {
      return { cierreDebeSerAntes: true };
    }

    return null;
  }

  get errorCierreInscripciones(): string | null {
    if (this.ligaForm.errors?.['cierreDebeSerAntes'] &&
      this.ligaForm.get('cierre_inscripciones')?.touched) {
      return 'El cierre de inscripciones debe ser antes de la fecha de inicio de la liga';
    }
    return null;
  }

  async guardarLiga(): Promise<void> {
    if (this.ligaForm.invalid) {
      this.error = 'Por favor complete todos los campos requeridos';
      return;
    }

    // Validar que cada grupo tenga al menos 2 sistemas de desempate
    for (let i = 0; i < this.grupos.length; i++) {
      const desempates = this.grupos.at(i).get('desempates')?.value || [];
      if (desempates.length < 2) {
        this.error = `El grupo ${i + 1} debe tener al menos 2 sistemas de desempate`;
        return;
      }
    }

    this.loading = true;
    this.error = null;

    try {
      const formValue = this.ligaForm.value;

      // Crear la liga principal
      const ligaData = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion || null,
        fecha_inicio: formValue.fecha_inicio,
        fecha_fin: formValue.fecha_fin || null,
        lugar: formValue.lugar,
        direccion: formValue.direccion || null,
        tipo_sistema: formValue.tipo_sistema,
        num_grupos: formValue.num_grupos,
        clasifican_por_grupo: formValue.clasifican_por_grupo,
        idRitmoJuego: formValue.idRitmoJuego || null,
        costo_inscripcion: formValue.costo_inscripcion,
        cierre_inscripciones: formValue.cierre_inscripciones || null,
        max_jugadores: formValue.max_jugadores || null,
        notas: formValue.notas || null,
        activo: 1
      };

      const ligaCreada = await this.infoLigaService.create(ligaData).toPromise();

      if (!ligaCreada?.idLiga) {
        throw new Error('No se pudo crear la liga');
      }

      // Crear los grupos
      for (const grupo of formValue.grupos) {
        const premiosObj: any = {};
        grupo.premios.forEach((p: any, idx: number) => {
          premiosObj[idx + 1] = p.monto || '0';
        });

        const grupoData = {
          idLiga: ligaCreada.idLiga,
          nombre: grupo.nombre,
          descripcion: grupo.descripcion || null,
          max_jugadores: grupo.max_jugadores || null,
          rondas: grupo.rondas,
          premios: premiosObj,
          desempates: grupo.desempates.map((id: number) =>
            this.sistemasDesempate.find(s => s.idDesempate === id)?.nombre || ''
          ),
          activo: 1
        };

        await this.grupoLigaService.create(grupoData).toPromise();
      }

      this.router.navigate(['/main-view/ligas']);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al crear la liga';
      console.error('Error completo:', err);
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.router.navigate(['/main-view/ligas']);
  }
}