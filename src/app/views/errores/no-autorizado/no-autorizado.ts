import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorPageComponent } from '../../../componentes/templates/error-page/error-page';

@Component({
  selector: 'app-no-autorizado',
  standalone: true,
  imports: [ErrorPageComponent],
  templateUrl: './no-autorizado.html'
})
export class NoAutorizadoComponent {
  constructor(private router: Router) { }

  irAlInicio(): void {
    this.router.navigate(['/main-view']);
  }
}
