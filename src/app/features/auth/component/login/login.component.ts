import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: '../../styles/form.css',
})
export class LoginComponent implements OnInit {
  private router = inject(Router);

  private authService = inject(AuthService);
  errorMessage: any = {
    invalidEmailMessage: '',
    invalidPasswordMessage: '',
    invalidConfirmPasswordMessage: '',
  };
  message = '';
  isFormSubmitted = false;
  inProcess = false;
  private allowLogin = false;
  private redirectTo = '';

  loginForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30),
      ],
    }),
  });

  ngOnInit(): void {
    this.redirectTo = history.state['redirectTo'];
    const email = history.state['email'];
    this.allowLogin = history.state['allowLogin'];

    this.formControls.email.setValue(email ?? '');

    this.formControls.email.valueChanges.subscribe((val) => {
      this.invalidEmail();
    });
    this.formControls.password.valueChanges.subscribe((val) => {
      this.invalidPassword();
    });
  }

  get formControls() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.isFormSubmitted = true;

    let invalidForm = this.invalidEmail() || this.invalidPassword();
    if (invalidForm || this.inProcess) {
      return;
    }

    this.inProcess = true;

    let user = {
      email: this.formControls.email.value,
      password: this.formControls.password.value,
    };

    this.authService.authenticateUser(user).subscribe({
      next: (status) => {
        this.inProcess = false;
        const redirectTo = history.state['redirectTo'];
        if (redirectTo) {
          return this.router.navigate([redirectTo], {
            replaceUrl: true,
          });
        }
        return this.router.navigate(['/home'], {
          replaceUrl: true,
        });
      },
      error: (errorMessage) => {
        this.inProcess = false;
        this.message = errorMessage.message;
        setTimeout(() => {
          this.message = '';
        }, 3000);
      },
    });
  }

  redirectToLogin() {
    return this.router.navigate(['/signup'], {
      state: {
        allowLogin: this.allowLogin,
        redirectTo: this.redirectTo,
      },
    });
  }

  invalidEmail() {
    const email = this.formControls.email;
    const hasError =
      (email.touched && email.dirty && email.invalid) ||
      (this.isFormSubmitted && email.invalid);
    if (hasError) {
      if (email.hasError('email')) {
        this.errorMessage.invalidEmailMessage = 'Invalid email address';
      } else if (email.hasError('required')) {
        this.errorMessage.invalidEmailMessage = 'Email is required';
      }
    } else {
      this.errorMessage.invalidEmailMessage = '';
    }
    return hasError;
  }

  invalidPassword() {
    const password = this.formControls.password;
    const hasError =
      (password.touched && password.dirty && password.invalid) ||
      (this.isFormSubmitted && password.invalid);
    if (hasError) {
      if (password.hasError('minlength')) {
        this.errorMessage.invalidPasswordMessage =
          'Password length must be 6 or more';
      } else if (password.hasError('maxlength')) {
        this.errorMessage.invalidPasswordMessage =
          'Password length must be 30 or less';
      } else if (password.hasError('required')) {
        this.errorMessage.invalidPasswordMessage = 'Password is required';
      }
    } else {
      this.errorMessage.invalidPasswordMessage = '';
    }
    return hasError;
  }
}
