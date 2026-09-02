import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    {path: '', loadComponent: () => import('./views/landing-page/landing-page').then(m => m.LandingComponent)},
    {path: 'landing-page', loadComponent: () => import('./views/landing-page/landing-page').then(m => m.LandingComponent)},
    {path: 'login', loadComponent: () => import('./authentication/login/login').then(m => m.LoginComponent)},
    {path: 'inscripcion/:id' , loadComponent: () => import('./views/publico/inscripcion/inscripcion').then(m => m.InscripcionComponent)},
    {path: 'players-stats' , loadComponent: () => import('./views/player-stats/player-stats').then(m => m.PlayerStatsComponent)},
    {path: 'jugador-resultado' , loadComponent: () => import('./views/jugador-resultado/jugador-resultado').then(m => m.JugadorResultadoComponent)},
    {path: 'reloj-section' , loadComponent: () => import('./views/reloj-section/reloj-section').then(m => m.RelojSectionComponent)},
    {path: 'jugador-liga' , loadComponent: () => import('./views/jugador-liga/jugador-liga').then(m => m.JugadorLigaComponent)},
    {path: 'main-view', loadComponent: () => import('./views/main-view/main-view').then(m => m.MainView),

        canActivate: [authGuard],
        canActivateChild: [roleGuard],
        children: [
            // Torneo Actual y sus subapartados
            {path: 'torneo-actual', loadComponent: () => import('./views/admin/torneos/torneo-actual/torneo-actual').then(m => m.TorneoActualComponent)},
            {path: 'inscripciones-torneo', loadComponent: () => import('./views/admin/torneos/inscripciones-torneo/inscripciones-torneo').then(m => m.InscripcionesAdminComponent)},
            {path: 'listas', loadComponent: () => import('./views/admin/torneos/listas-torneo/listas-torneo').then(m => m.ListasTorneoComponent)},
            {path: 'mesas-torneo', loadComponent: () => import('./views/admin/torneos/mesas-torneo/mesas-torneo').then(m => m.MesasTorneoComponent)},
            {path: 'resultados-torneo', loadComponent: () => import('./views/admin/torneos/resultados-torneo/resultados-torneo').then(m => m.ResultadosTorneoComponent)},
            {path: 'historial-jugador-torneo' , loadComponent: () => import('./views/admin/torneos/historial-jugador-torneo/historial-jugador-torneo').then(m => m.HistorialJugadorComponent)},
            // Inscripciones y sus subapartados
            {path: 'inscripciones-generales' , loadComponent: () => import('./views/admin/pagos/inscripciones-generales/inscripciones-generales').then(m => m.InscripcionesGeneralesComponent)},
            {path: 'jugadores-torneo', loadComponent: () => import('./views/admin/jugadores/jugadores-torneo/jugadores-torneo').then(m => m.JugadoresTorneoComponent)},
            {path: 'estadisticas-pago', loadComponent: () => import('./views/admin/pagos/estadisticas-pagos/estadisticas-pagos').then(m => m.EstadisticasPagosComponent)},
            // Gestión de Torneos
            {path: 'nuevo-torneo', loadComponent: () => import('./views/admin/torneos/nuevo-torneo/nuevo-torneo').then(m => m.NuevoTorneoComponent)},
            {path: 'configuracion-torneos', data: { roles: ['adminGral'] }, loadComponent: () => import('./views/admin/torneos/configuracion-torneos/configuracion-torneos').then(m => m.ConfiguracionTorneosComponent)},
            {path: 'resultado-todos-torneos' , loadComponent: () => import('./views/admin/torneos/resultado-todos-torneos/resultado-todos-torneos').then(m => m.ResultadosTodoTorneosComponent)},
            {path: 'visualizacion-mesas' , loadComponent: () => import('./views/admin/torneos/visualizacion-mesas/visualizacion-mesas').then(m => m.VisualizacionMesasComponent)},
            {path: 'torneos', loadComponent: () => import('./views/admin/torneos/torneos/torneos').then(m => m.TorneosComponent)},
            {path: 'editar-torneo/:id', loadComponent: () => import('./views/admin/torneos/editar-torneo/editar-torneo').then(m => m.EditarTorneoComponent)},
            {path: 'detalle-torneo/:id', loadComponent: () => import('./views/admin/torneos/torneo-detalles/torneo-detalles').then(m => m.TorneoDetalleComponent)},
            {path: 'sistemas-pago' , data: { roles: ['adminGral'] }, loadComponent: () => import('./views/admin/pagos/sistemas-pago/sistemas-pago').then(m => m.SistemasPagoComponent)},
            {path: 'resultados-torneo/:id', loadComponent: () => import('./views/admin/torneos/resultados-torneo/resultados-torneo').then(m => m.ResultadosTorneoComponent)},
            // Gestión Liga
            {path: 'ligas', loadComponent: () => import('./views/admin/ligas/ligas/ligas').then(m => m.LigasComponent)},
            {path: 'detalle-liga/:id', loadComponent: () => import('./views/admin/ligas/detalles-liga/detalles-liga').then(m => m.DetalleLigaComponent)},
            {path: 'editar-liga/:id', loadComponent: () => import('./views/admin/ligas/editar-liga/editar-liga').then(m => m.EditarLigaComponent)},
            {path: 'nueva-liga' , loadComponent: () => import('./views/admin/ligas/nueva-liga/nueva-liga').then(m => m.NuevaLigaComponent)},
            {path: 'inscripciones-liga' ,loadComponent: () => import('./views/admin/ligas/inscripciones-liga/inscripciones-liga').then(m => m.InscripcionesLigaComponent)},
            {path: 'mesas-liga' , loadComponent: () => import('./views/admin/ligas/mesas-liga/mesas-liga').then(m => m.MesasLigaComponent)},
            // Gestión de Jugadores
            {path: 'gestion-jugadores', loadComponent: () => import('./views/admin/jugadores/gestion-jugadores/gestion-jugadores').then(m => m.GestionJugadoresComponent)},
            {path: 'inscripcion-admin', loadComponent: () => import('./views/admin/jugadores/inscripciones-admin/inscripciones-admin').then(m => m.InscripcionesAdminComponent)},
            // Sistema
            {path: 'configuracion', data: { roles: ['adminGral'] }, loadComponent: () => import('./views/admin/sistema/configuracion/configuracion').then(m => m.Configuracion)}
        ]
    },
    {path: '**', redirectTo: ''}
];