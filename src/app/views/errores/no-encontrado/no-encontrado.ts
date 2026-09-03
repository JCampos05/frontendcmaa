import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorPageComponent } from '../../../componentes/templates/error-page/error-page';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [ErrorPageComponent],
  templateUrl: './no-encontrado.html'
})
export class NoEncontradoComponent {
  constructor(private router: Router) { }

  irAlInicio(): void {
    this.router.navigate(['/main-view']);
  }
}
