import { Component } from '@angular/core';
import { ErrorPageComponent } from '../../../componentes/templates/error-page/error-page';

@Component({
  selector: 'app-error-general',
  standalone: true,
  imports: [ErrorPageComponent],
  templateUrl: './error-general.html'
})
export class ErrorGeneralComponent {
  reintentar(): void {
    window.location.reload();
  }
}
