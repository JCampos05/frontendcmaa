import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastNoti } from '../../componentes/modales/toast-noti/toast-noti';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastNoti],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  telefono: string = '';
  password: string = '';
  showPassword: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/main-view/torneo-actual']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.telefono || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.telefono, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.toast.success('Éxito', 'Inicio de sesión exitoso');
        // Dar tiempo para que se guarde el token en localStorage
        setTimeout(() => {
          this.router.navigate(['/main-view/torneo-actual']);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }

  goToLanding(): void {
    this.router.navigate(['/']);
  }
}