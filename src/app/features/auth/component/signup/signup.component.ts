import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs';
import { AccountService } from '../../../../core/services/account.service';

function passwordMatch(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password?.value === confirmPassword?.value) {
    return null;
  }
  return { passwordMatch: false };
}

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: '../../styles/form.css',
})
export class SignupComponent implements OnInit {
  private router = inject(Router);

  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  isFormSubmitted = false;
  checkingUsername = false;
  private role = 'player';
  private allowLogin = false;
  private redirectTo = '';

  errorMessage = {
    invalidEmailMessage: '',
    invalidUsernameMessage: '',
    invalidPasswordMessage: '',
    invalidConfirmPasswordMessage: '',
  };
  message = '';

  signupForm = new FormGroup({
    username: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[A-Za-z0-9_.]+$'),
        Validators.maxLength(20),
        Validators.minLength(6),
      ],
    }),
    email: new FormControl('', {
      validators: [Validators.email, Validators.required],
    }),
    passwords: new FormGroup(
      {
        password: new FormControl('', {
          validators: [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(30),
          ],
        }),
        confirmPassword: new FormControl({ value: '', disabled: true }),
      },
      { validators: [passwordMatch] }
    ),
  });

  ngOnInit(): void {
    this.redirectTo = history.state['redirectTo'];
    this.role = history.state.role || 'player';
    this.allowLogin = history.state.allowLogin;

    this.formControls.username.valueChanges
      .pipe(debounceTime(1500))
      .subscribe((username) => {
        if (this.invalidUsername()) {
          return;
        }
        this.errorMessage.invalidUsernameMessage = '';

        this.checkingUsername = true;
        this.accountService
          .checkIfUsernameIsTaken(username!)
          .subscribe((isTaken) => {
            this.checkingUsername = false;
            if (isTaken) {
              this.errorMessage.invalidUsernameMessage =
                'Username already taken!';
            }
          });
      });

    this.formControls.email.valueChanges.subscribe((val) => {
      this.invalidEmail();
    });
    this.formControlsOfPassword.password.valueChanges.subscribe((val) => {
      this.isPasswordValid();
      this.invalidPassword();
    });
    this.formControls.passwords.valueChanges.subscribe((val) => {
      this.invalidConfirmPassword();
    });
  }

  get formControls() {
    return this.signupForm.controls;
  }

  get formControlsOfPassword() {
    return this.signupForm.controls.passwords.controls;
  }

  isPasswordValid() {
    const isValid = this.formControlsOfPassword.password.valid;
    isValid
      ? this.formControlsOfPassword.confirmPassword.enable()
      : this.formControlsOfPassword.confirmPassword.disable();
  }

  onSubmit() {
    this.isFormSubmitted = true;

    let invalidForm =
      this.invalidUsername() ||
      this.invalidEmail() ||
      this.invalidPassword() ||
      this.invalidConfirmPassword();
    if (invalidForm) {
      return;
    }

    let user = {
      username: this.formControls.username.value,
      email: this.formControls.email.value,
      password: this.formControlsOfPassword.password.value,
      role: this.role,
    };

    this.authService.registerUser(user).subscribe({
      next: (saved) => {
        if (this.redirectTo) {
          return this.router.navigate([this.redirectTo], {
            replaceUrl: true,
          });
        }
        return this.router.navigate(['/home'], {
          replaceUrl: true,
        });
      },
      error: (errorMessage) => {
        this.message = errorMessage.message;
        setTimeout(() => {
          this.message = '';
        }, 3000);
      },
    });
  }

  redirectToLogin() {
    return this.router.navigate(['/login'], {
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

  invalidUsername() {
    const username = this.formControls.username;
    const hasError =
      (username.touched && username.dirty && username.invalid) ||
      (this.isFormSubmitted && username.invalid);
    if (hasError) {
      if (username.hasError('minlength')) {
        this.errorMessage.invalidUsernameMessage =
          'Username length must be 6 or more';
      } else if (username.hasError('maxlength')) {
        this.errorMessage.invalidUsernameMessage =
          'Username length must be 20 or less';
      } else if (username.hasError('required')) {
        this.errorMessage.invalidUsernameMessage = 'Username is required';
      } else if (username.hasError('pattern')) {
        this.errorMessage.invalidUsernameMessage =
          'Username must consist of numbers, alphabets and (_) (.)';
      }
    } else {
      this.errorMessage.invalidUsernameMessage = '';
    }
    return hasError;
  }

  invalidPassword() {
    const password = this.formControlsOfPassword.password;
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

  invalidConfirmPassword() {
    const passwords = this.formControls.passwords;
    const confirmPassword = this.formControlsOfPassword.confirmPassword;
    const hasError =
      (confirmPassword.touched && confirmPassword.dirty && passwords.invalid) ||
      (this.isFormSubmitted && passwords.invalid);
    if (hasError) {
      if (!passwords.hasError('passwordMatch')) {
        this.errorMessage.invalidConfirmPasswordMessage =
          'Passwords do not match!';
      }
    } else {
      this.errorMessage.invalidConfirmPasswordMessage = '';
    }
    return hasError;
  }
}
