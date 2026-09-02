import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriaService } from '../../../../services/categoria';
import { SistemaCompetenciaService } from '../../../../services/sistema-competencia';
import { RitmoJuegoService } from '../../../../services/ritmo-juego';
import { SistemaDesempateService } from '../../../../services/sistema-desempates';
import { Categoria } from '../../../../models/categoria';
import { SistemaCompetencia } from '../../../../models/sistema-competencia';
import { RitmoJuego } from '../../../../models/ritmo-juego';
import { SistemaDesempate } from '../../../../models/sistema-desempates';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';

@Component({
  selector: 'app-configuracion-torneos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastNoti, PageHeaderComponent, ButtonComponent],
  templateUrl: './configuracion-torneos.html',
  styleUrls: ['./configuracion-torneos.css']
})
export class ConfiguracionTorneosComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  tabActiva: 'categorias' | 'sistemas' | 'ritmos' | 'desempates' = 'categorias';

  categorias: Categoria[] = [];
  sistemas: SistemaCompetencia[] = [];
  ritmos: RitmoJuego[] = [];
  desempates: SistemaDesempate[] = [];

  categoriaForm!: FormGroup;
  sistemaForm!: FormGroup;
  ritmoForm!: FormGroup;
  desempateForm!: FormGroup;

  mostrandoFormCategoria = false;
  mostrandoFormSistema = false;
  mostrandoFormRitmo = false;
  mostrandoFormDesempate = false;
  editandoCategoria: Categoria | null = null;
  editandoSistema: SistemaCompetencia | null = null;
  editandoRitmo: RitmoJuego | null = null;
  editandoDesempate: SistemaDesempate | null = null;

  mostrarModalEliminar = false;
  itemAEliminar: any = null;
  tipoItemAEliminar: 'categoria' | 'sistema' | 'ritmo' | 'desempate' = 'categoria';

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private sistemaService: SistemaCompetenciaService,
    private ritmoService: RitmoJuegoService,
    private desempateService: SistemaDesempateService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.cargarDatos();
  }

  /** Etiqueta del botón "Nuevo" del header, según la pestaña activa. */
  get tituloNuevo(): string {
    switch (this.tabActiva) {
      case 'categorias': return 'Nueva Categoría';
      case 'sistemas': return 'Nuevo Sistema';
      case 'ritmos': return 'Nuevo Ritmo';
      case 'desempates': return 'Nuevo Sistema de Desempate';
    }
  }

  /** Oculta el botón del header mientras el formulario de la pestaña activa está abierto. */
  get mostrandoFormularioActivo(): boolean {
    switch (this.tabActiva) {
      case 'categorias': return this.mostrandoFormCategoria;
      case 'sistemas': return this.mostrandoFormSistema;
      case 'ritmos': return this.mostrandoFormRitmo;
      case 'desempates': return this.mostrandoFormDesempate;
    }
  }

  /** Botón "Nuevo" único en el header: despacha al formulario de la pestaña activa. */
  nuevoItem(): void {
    switch (this.tabActiva) {
      case 'categorias': this.mostrarFormularioCategoria(); break;
      case 'sistemas': this.mostrarFormularioSistema(); break;
      case 'ritmos': this.mostrarFormularioRitmo(); break;
      case 'desempates': this.mostrarFormularioDesempate(); break;
    }
  }

  initForms(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      costo: [0, [Validators.required, Validators.min(0)]],
      edadMinima: [null, [Validators.min(0), Validators.max(120)]],
      edadMaxima: [null, [Validators.min(0), Validators.max(120)]],
      nota: ['']
    });

    this.sistemaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });

    this.ritmoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      minutos: [0, [Validators.required, Validators.min(1)]],
      incremento: [0, [Validators.min(0)]]
    });

    this.desempateForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }

  cargarDatos(): void {
    this.cargarCategorias();
    this.cargarSistemas();
    this.cargarRitmos();
    this.cargarDesempates();
  }

  cargarCategorias(): void {
    this.categoriaService.getAll().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  mostrarFormularioCategoria(): void {
    this.mostrandoFormCategoria = true;
    this.editandoCategoria = null;
    this.categoriaForm.reset({
      costo: 0,
      edadMinima: null,
      edadMaxima: null
    });
  }

  editarCategoria(categoria: Categoria): void {
    this.editandoCategoria = categoria;
    this.mostrandoFormCategoria = true;
    this.categoriaForm.patchValue({
      nombre: categoria.nombre,
      costo: categoria.costo,
      nota: categoria.nota,
      edadMinima: categoria.edadMinima,
      edadMaxima: categoria.edadMaxima
    });
  }

  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const categoriaData = this.categoriaForm.value;

    // Convertir valores vacíos a null
    if (categoriaData.edadMinima === '' || categoriaData.edadMinima === undefined) {
      categoriaData.edadMinima = null;
    }
    if (categoriaData.edadMaxima === '' || categoriaData.edadMaxima === undefined) {
      categoriaData.edadMaxima = null;
    }

    // Validación: edadMinima no puede ser mayor que edadMaxima
    if (categoriaData.edadMinima !== null && categoriaData.edadMaxima !== null) {
      if (categoriaData.edadMinima > categoriaData.edadMaxima) {
        this.toast.error('Error', 'La edad mínima no puede ser mayor que la edad máxima');
        return;
      }
    }

    if (this.editandoCategoria) {
      this.categoriaService.update(this.editandoCategoria.idCategoria!, categoriaData).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Categoría actualizada correctamente');
          this.cargarCategorias();
          this.cancelarFormCategoria();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al actualizar categoría');
        }
      });
    } else {
      this.categoriaService.create(categoriaData).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Categoría creada correctamente');
          this.cargarCategorias();
          this.cancelarFormCategoria();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al crear categoría');
        }
      });
    }
  }

  cancelarFormCategoria(): void {
    this.mostrandoFormCategoria = false;
    this.editandoCategoria = null;
    this.categoriaForm.reset({
      costo: 0,
      edadMinima: null,
      edadMaxima: null
    });
  }

  confirmarEliminarCategoria(categoria: Categoria): void {
    this.itemAEliminar = categoria;
    this.tipoItemAEliminar = 'categoria';
    this.mostrarModalEliminar = true;
  }

  cargarSistemas(): void {
    this.sistemaService.getAll().subscribe({
      next: (data) => {
        this.sistemas = data;
      },
      error: (error) => {
        //console.error('Error al cargar sistemas:', error);
        this.toast.error('Error', 'Error al cargar sistemas');
      }
    });
  }

  mostrarFormularioSistema(): void {
    this.mostrandoFormSistema = true;
    this.editandoSistema = null;
    this.sistemaForm.reset();
  }

  editarSistema(sistema: SistemaCompetencia): void {
    this.editandoSistema = sistema;
    this.mostrandoFormSistema = true;
    this.sistemaForm.patchValue({
      nombre: sistema.nombre,
      descripcion: sistema.descripcion
    });
  }

  guardarSistema(): void {
    if (this.sistemaForm.invalid) {
      this.sistemaForm.markAllAsTouched();
      return;
    }

    const sistemaData = this.sistemaForm.value;

    if (this.editandoSistema) {
      this.sistemaService.update(this.editandoSistema.idSisCompetencia!, sistemaData).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Sistema de competencia creado correctamente');
          this.cargarSistemas();
          this.cancelarFormSistema();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al actualizar sistema');
          //alert(error.error?.message || 'Error al actualizar sistema');
        }
      });
    } else {
      this.sistemaService.create(sistemaData).subscribe({
        next: () => {
          this.cargarSistemas();
          this.cancelarFormSistema();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al crear el sistema');
          //alert(error.error?.message || 'Error al crear sistema');
        }
      });
    }
  }

  cancelarFormSistema(): void {
    this.mostrandoFormSistema = false;
    this.editandoSistema = null;
    this.sistemaForm.reset();
  }

  confirmarEliminarSistema(sistema: SistemaCompetencia): void {
    this.itemAEliminar = sistema;
    this.tipoItemAEliminar = 'sistema';
    this.mostrarModalEliminar = true;
  }

  cargarRitmos(): void {
    this.ritmoService.getAll().subscribe({
      next: (data) => {
        this.ritmos = data;
      },
      error: (error) => {
        //console.error('Error al cargar ritmos:', error);
        this.toast.error('Error', 'Error al cargar los ritmos de juego');
      }
    });
  }

  mostrarFormularioRitmo(): void {
    this.mostrandoFormRitmo = true;
    this.editandoRitmo = null;
    this.ritmoForm.reset({ minutos: 0, incremento: 0 });
  }

  editarRitmo(ritmo: RitmoJuego): void {
    this.editandoRitmo = ritmo;
    this.mostrandoFormRitmo = true;
    this.ritmoForm.patchValue({
      nombre: ritmo.nombre,
      descripcion: ritmo.descripcion,
      minutos: ritmo.minutos,
      incremento: ritmo.incremento
    });
  }

  guardarRitmo(): void {
    if (this.ritmoForm.invalid) {
      this.ritmoForm.markAllAsTouched();
      return;
    }

    const ritmoData = this.ritmoForm.value;

    if (this.editandoRitmo) {
      this.ritmoService.update(this.editandoRitmo.idRitmoJuego!, ritmoData).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Ritmo de juego creado correctamente');
          this.cargarRitmos();
          this.cancelarFormRitmo();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al actualizar ritmo');
          //alert(error.error?.message || 'Error al actualizar ritmo');
        }
      });
    } else {
      this.ritmoService.create(ritmoData).subscribe({
        next: () => {
          this.cargarRitmos();
          this.cancelarFormRitmo();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al crear ritmo')
          //alert(error.error?.message || 'Error al crear ritmo');
        }
      });
    }
  }

  cancelarFormRitmo(): void {
    this.mostrandoFormRitmo = false;
    this.editandoRitmo = null;
    this.ritmoForm.reset({ minutos: 0, incremento: 0 });
  }

  confirmarEliminarRitmo(ritmo: RitmoJuego): void {
    this.itemAEliminar = ritmo;
    this.tipoItemAEliminar = 'ritmo';
    this.mostrarModalEliminar = true;
  }

  cargarDesempates(): void {
    this.desempateService.getAll().subscribe({
      next: (data) => {
        this.desempates = data;
      },
      error: (error) => {
        console.error('Error al cargar sistemas de desempate:', error);
        this.toast.error('Error', 'Error al cargar sistemas de desempate');
      }
    });
  }

  mostrarFormularioDesempate(): void {
    this.mostrandoFormDesempate = true;
    this.editandoDesempate = null;
    this.desempateForm.reset();
  }

  editarDesempate(desempate: SistemaDesempate): void {
    this.editandoDesempate = desempate;
    this.mostrandoFormDesempate = true;
    this.desempateForm.patchValue({
      nombre: desempate.nombre,
      descripcion: desempate.descripcion
    });
  }

  guardarDesempate(): void {
    if (this.desempateForm.invalid) {
      this.desempateForm.markAllAsTouched();
      return;
    }

    const desempateData = this.desempateForm.value;

    if (this.editandoDesempate) {
      this.desempateService.update(this.editandoDesempate.idDesempate!, desempateData).subscribe({
        next: () => {
          this.toast.success('Éxito', 'Sistema de desempate creado correctamente');
          this.cargarDesempates();
          this.cancelarFormDesempate();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al actualizar sistema de desempate');
          //alert(error.error?.message || 'Error al actualizar sistema de desempate');
        }
      });
    } else {
      this.desempateService.create(desempateData).subscribe({
        next: () => {
          this.cargarDesempates();
          this.cancelarFormDesempate();
        },
        error: (error) => {
          this.toast.error('Error', error.error?.message || 'Error al crear sistema de desempate');
          //alert(error.error?.message || 'Error al crear sistema de desempate');
        }
      });
    }
  }

  cancelarFormDesempate(): void {
    this.mostrandoFormDesempate = false;
    this.editandoDesempate = null;
    this.desempateForm.reset();
  }

  confirmarEliminarDesempate(desempate: SistemaDesempate): void {
    this.itemAEliminar = desempate;
    this.tipoItemAEliminar = 'desempate';
    this.mostrarModalEliminar = true;
  }

  eliminarItem(): void {
    if (!this.itemAEliminar) return;

    const id = this.itemAEliminar.idCategoria
      || this.itemAEliminar.idSisCompetencia
      || this.itemAEliminar.idRitmoJuego
      || this.itemAEliminar.idDesempate;

    switch (this.tipoItemAEliminar) {
      case 'categoria':
        this.categoriaService.delete(id!).subscribe({
          next: () => {
            this.cargarCategorias();
            this.cerrarModalEliminar();
          },
          error: (error) => {
            this.toast.error('Error', error.error?.message || 'Error al eliminar categoría');
            //alert(error.error?.message || 'Error al eliminar categoría');
            this.cerrarModalEliminar();
          }
        });
        break;

      case 'sistema':
        this.sistemaService.delete(id!).subscribe({
          next: () => {
            this.cargarSistemas();
            this.cerrarModalEliminar();
          },
          error: (error) => {
            this.toast.error('Error', error.error?.message || 'Error al eliminar sistema');
            //alert(error.error?.message || 'Error al eliminar sistema');
            this.cerrarModalEliminar();
          }
        });
        break;

      case 'ritmo':
        this.ritmoService.delete(id!).subscribe({
          next: () => {
            this.cargarRitmos();
            this.cerrarModalEliminar();
          },
          error: (error) => {
            this.toast.error('Error', error.error?.message || 'Error al eliminar ritmo');
            //(error.error?.message || 'Error al eliminar ritmo');
            this.cerrarModalEliminar();
          }
        });
        break;

      case 'desempate':
        this.desempateService.delete(id!).subscribe({
          next: () => {
            this.cargarDesempates();
            this.cerrarModalEliminar();
          },
          error: (error) => {
            this.toast.error('Error', error.error?.message || 'Error al eliminar sistema de desempate');
            //alert(error.error?.message || 'Error al eliminar sistema de desempate');
            this.cerrarModalEliminar();
          }
        });
        break;
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.itemAEliminar = null;
  }

  cambiarTab(tab: 'categorias' | 'sistemas' | 'ritmos' | 'desempates'): void {
    this.tabActiva = tab;
    this.cancelarFormCategoria();
    this.cancelarFormSistema();
    this.cancelarFormRitmo();
    this.cancelarFormDesempate();
  }

  getNombreItemAEliminar(): string {
    return this.itemAEliminar?.nombre || '';
  }
}
