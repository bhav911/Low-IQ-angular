import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/User.model';
import { LoadingSpinnerComponent } from "../../../../shared/components/loading-spinner/loading-spinner.component";

type FormKeys = keyof EditProfileComponent['myForm']['controls'];

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
})
export class EditProfileComponent implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  user: User | null = null;
  activeComponents = new Array<boolean>(7);
  passwordVisibility = new Array<boolean>(3);
  loaded = false;
  emailUpdateError = false;
  changePassword: boolean = false;
  alertMessage = false;
  passwordUpdateError = false;
  showOtpComponent = false;
  otpInputs!: NodeListOf<HTMLInputElement>;
  inProcess = false;
  otpSent = false;
  myForm = new FormGroup({
    name: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.maxLength(30),
      ],
    }),
    username: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[A-Za-z0-9_.]+$'),
        Validators.maxLength(20),
        Validators.minLength(6),
      ],
    }),
    phoneNumber: new FormControl('', {
      validators: [Validators.required, Validators.pattern('^\\d{10}$')],
    }),
    email: new FormControl('', {
      validators: [Validators.email, Validators.required],
    }),
    password: new FormGroup({
      currentPassword: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ],
      }),
      newPassword: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ],
      }),
      confirmPassword: new FormControl(
        { value: '', disabled: true },
        {
          validators: [Validators.maxLength(20)],
        }
      ),
    }),
  });

  fieldMap = ['username', 'name', 'phoneNumber', 'email', 'currentPassword'];
  checkingUsername = false;
  usernameAlreadyTaken = true;
  editUsername = false;
  imagePreview: string | null = null;
  imageFormData!: FormData;

  errorMessage = {
    invalidEmailMessage: '',
    invalidUsernameMessage: '',
    invalidNameMessage: '',
    invalidPhoneNumberMessage: '',
    invalidPasswordMessage: '',
    invalidNewPasswordMessage: '',
    invalidConfirmPasswordMessage: '',
  };
  backendMessage = '';
  backendSuccess = false;

  ngOnInit(): void {
    this.accountService.getUser().subscribe((user) => {
      this.imagePreview = user!.profilePicture.link ?? null;
      this.myForm.patchValue(user);
      this.loaded = true;
      this.user = user;

      this.f.username.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((username) => {
          if (this.invalidUsername() || username === this.user?.username) {
            return;
          }
          this.errorMessage.invalidUsernameMessage = '';

          this.checkingUsername = true;
          this.accountService
            .checkIfUsernameIsTaken(username!)
            .subscribe((isTaken) => {
              this.usernameAlreadyTaken = isTaken;
              this.checkingUsername = false;
              if (isTaken) {
                this.errorMessage.invalidUsernameMessage =
                  'Username already taken!';
              }
            });
        });

      this.f.username.valueChanges.subscribe((username) => {
        this.usernameAlreadyTaken = true;
        this.invalidUsername();
      });

      this.f.email.valueChanges.subscribe((val) => {
        this.invalidEmail();
      });
      this.f.name.valueChanges.subscribe((val) => {
        this.invalidName();
      });
      this.f.phoneNumber.valueChanges.subscribe((val) => {
        this.invalidPhoneNumber();
      });
      this.p.currentPassword.valueChanges.subscribe((val) => {
        this.invalidConfirmPassword();
        this.invalidPassword();
      });
      this.p.confirmPassword.valueChanges.subscribe((val) => {
        this.invalidConfirmPassword();
      });
      this.p.newPassword.valueChanges.subscribe((val) => {
        this.invalidNewPassword();
      });
    });
  }

  onInput(event: any, index: number) {
    const input = event.target;
    if (input.value && index < this.otpInputs.length - 1) {
      this.otpInputs[index + 1].focus();
    }
  }

  onKeydown(event: any, index: number) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      this.otpInputs[index - 1].focus();
    }
  }

  get f() {
    return this.myForm.controls;
  }

  get p() {
    return this.f['password'].controls;
  }

  imageSelected(event: Event) {
    this.editComponent(0);
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files[0]) {
      const file = inputElement.files[0];

      if (!file.type.startsWith('image/')) {
        console.error('Selected file is not an image.');
        return;
      }

      this.imageFormData = new FormData();
      this.imageFormData.append('image', file);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  updateProfileImage() {
    this.inProcess = true;
    this.accountService
      .updateProfileImage(this.imageFormData)
      .subscribe((profileUrl) => {
        this.user!.profilePicture!.link = profileUrl;
        this.inProcess = false;
        this.editComponent(0);
        this.activeComponents.fill(false);
      });
  }

  deleteProfilePicture() {
    this.inProcess = true;
    this.accountService.deleteProfileImage().subscribe(({ Success }: any) => {
      if (Success) {
        this.user!.profilePicture!.link = '';
      }
      this.inProcess = false;
      this.editComponent(0);
      this.activeComponents.fill(false);
    });
  }

  updateEmail() {
    if (this.invalidEmail() || this.invalidPassword() || this.inProcess) {
      return;
    }

    this.inProcess = true;
    let email = this.f.email.value;
    let password = this.p.currentPassword.value;
    this.accountService.updateEmail({ email, password }).subscribe({
      next: () => {
        this.inProcess = false;
        this.user!.email = this.f.email.value!;
        this.activeComponents.fill(false);
        this.resetPasswords();
      },
      error: (err) => {
        this.handleBackendMessage(err, false);
      },
    });
  }

  updateUsername() {
    let value = this.f.username.value!;
    if (this.invalidUsername() || this.inProcess) {
      return;
    }
    this.inProcess = true;
    this.accountService.updateUsername(value).subscribe({
      next: (success) => {
        this.inProcess = false;
        this.user!.username = value;
        this.activeComponents.fill(false);
      },
      error: (errorMessage) => {
        this.inProcess = false;
        this.errorMessage.invalidUsernameMessage = errorMessage;
      },
    });
  }

  updateDetail(field: FormKeys) {
    if (field === 'password' || this.inProcess) {
      return;
    }
    if (
      (field === 'name' && this.invalidName()) ||
      (field === 'phoneNumber' && this.invalidPhoneNumber())
    ) {
      return;
    }

    this.inProcess = true;

    let value = this.f[field].value!;
    this.accountService.updateProfile(field, value).subscribe({
      next: (data) => {
        this.inProcess = false;
        this.user![field] = this.f[field].value!;
        this.activeComponents.fill(false);
      },
      error: (err) => this.handleBackendMessage(err, false),
    });
  }

  updatePassword() {
    let newPassword = this.p.newPassword.value!;
    let currentPassword = this.p.currentPassword.value!;

    if (
      this.invalidNewPassword() ||
      this.invalidPassword() ||
      this.invalidConfirmPassword() ||
      this.inProcess
    ) {
      return;
    }

    this.inProcess = true;
    this.accountService
    .updatePassword({ currentPassword, newPassword })
    .subscribe({
      next: () => {
          this.inProcess = false;
          this.editComponent(5);
        },
        error: (err) => {
          this.handleBackendMessage(err, false);
        },
      });
  }

  sendOTPforEmail() {
    if (this.inProcess) {
      return;
    }
    this.inProcess = true;
    const sendOtpBtn = this.renderer.selectRootElement(
      '#sendOtpBtn',
      true
    ) as HTMLButtonElement;
    this.authService.sendOTPforEmailVerification().subscribe({
      next: (status) => {
        this.inProcess = false;
        this.otpSent = true;
        if (status) {
          this.otpInputs[0].focus();
          this.renderer.setProperty(sendOtpBtn, 'disabled', true);
          this.handleBackendMessage({ message: 'OTP Sent' }, true);
        }
      },
      error: (err) => {
        this.handleBackendMessage(err, false);
      },
    });
  }

  submitOtp() {
    let otp = '';
    this.otpInputs.forEach((ele) => {
      otp += ele.value;
    });
    if (otp.length < 4 || !this.otpSent) {
      let found = false;
      this.otpInputs.forEach((ele) => {
        if (!found && !ele.value) {
          found = true;
          ele.focus();
        }
      });
      return;
    }
    if (this.inProcess) {
      return;
    }
    this.inProcess = true;
    this.authService.submitOTPforEmailVerification(otp).subscribe({
      next: (status) => {
        this.inProcess = false;
        if (status) {
          this.user!.emailVerified = true;
          this.showOtpComponent = false;
        }
      },
      error: (err) => {
        this.inProcess = false;
        this.handleBackendMessage(err, false);
      },
    });
  }

  openOTPComponent() {
    this.showOtpComponent = !this.showOtpComponent;
    setTimeout(() => {
      this.otpInputs = this.el.nativeElement.querySelectorAll('.otp-input');
    }, 10);
  }

  getRange(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  sendPasswordResetMail() {
    if(this.inProcess){
      return;
    }
    if (!this.user?.emailVerified) {
      this.handleBackendMessage(
        { message: 'Please Verify Your Email Address First' },
        false
      );
      return;
    }

    this.inProcess = true;
    this.authService.sendPasswordResetMail(this.user.email!).subscribe({
      next: (success) => {
        this.inProcess = true;
        if (success) {
          this.handleBackendMessage({ message: 'Mail Sent' }, true);
        }
      },
      error: (err) => {
        this.handleBackendMessage(err, false);
      },
    });
  }

  handleBackendMessage({ message }: any, success: boolean) {
    this.backendMessage = message;
    this.backendSuccess = success;
    this.alertMessage = true;
    this.inProcess = false;
    setTimeout(() => {
      this.alertMessage = false;
      setTimeout(() => {
        this.backendMessage = '';
      }, 1000);
    }, 3000);
  }

  makePasswordVisible(index: number) {
    this.passwordVisibility[index] = !this.passwordVisibility[index];
  }

  editComponent(index: number) {
    if (this.activeComponents[index] && ![0, 5, 6].includes(index)) {
      this.revertFieldValueOnCancel(index, this.f, this.user);
    }
    let val = this.activeComponents[index];
    this.activeComponents.fill(false);
    this.activeComponents[index] = !val;
    this.resetPasswords();
  }

  editImageComponent(action: string) {
    if (action === 'delete') {
      this.imagePreview = null;
      this.editComponent(0);
      return;
    }
    if (action === 'cancel') {
      this.imagePreview = this.user?.profilePicture?.link ?? null;
      this.editComponent(0);
      return;
    }
    this.imagePreview ? this.updateProfileImage() : this.deleteProfilePicture();
  }

  resetPasswords() {
    this.f.password.reset();
  }

  revertFieldValueOnCancel(index: number, f: any, user: any) {
    let field = this.fieldMap[index - 1];
    f[field].setValue(user![field]);
  }

  invalidName() {
    const name = this.f['name'];
    const hasError = name.invalid;
    if (hasError) {
      if (name.hasError('maxlength')) {
        this.errorMessage.invalidNameMessage = 'Name length must be 30 or less';
      } else if (name.hasError('required')) {
        this.errorMessage.invalidNameMessage = 'Name is required';
      } else if (name.hasError('pattern')) {
        this.errorMessage.invalidNameMessage =
          'Name must consist of Alphabets only';
      }
    } else {
      this.errorMessage.invalidNameMessage = '';
    }
    return hasError;
  }

  invalidEmail() {
    const email = this.f['email'];
    const hasError = email.invalid;
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
    const username = this.f['username'];
    const hasError = username.invalid;
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
    const password = this.p.currentPassword;
    const hasError = password.invalid;
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
    const newPassword = this.p.newPassword.value;
    const confirmPassword = this.p.confirmPassword.value;
    const hasError = newPassword !== confirmPassword;
    if (hasError) {
      this.errorMessage.invalidConfirmPasswordMessage =
        'Passwords do not match!';
    } else {
      this.errorMessage.invalidConfirmPasswordMessage = '';
    }
    return hasError;
  }

  invalidNewPassword() {
    const password = this.p.newPassword;
    const hasError = password.invalid;
    if (hasError) {
      if (password.hasError('minlength')) {
        this.errorMessage.invalidNewPasswordMessage =
          'Password length must be 6 or more';
      } else if (password.hasError('maxlength')) {
        this.errorMessage.invalidNewPasswordMessage =
          'Password length must be 30 or less';
      } else if (password.hasError('required')) {
        this.errorMessage.invalidNewPasswordMessage = 'Password is required';
      }
      this.p.confirmPassword.disable();
    } else {
      this.errorMessage.invalidNewPasswordMessage = '';
      this.p.confirmPassword.enable();
    }
    return hasError;
  }

  invalidPhoneNumber() {
    const phone = this.f.phoneNumber;
    const hasError = phone.invalid;
    if (hasError) {
      if (phone.hasError('required')) {
        this.errorMessage.invalidPhoneNumberMessage =
          'Phone number is required';
      } else if (phone.hasError('pattern')) {
        this.errorMessage.invalidPhoneNumberMessage = 'Invalid phone number';
      }
    } else {
      this.errorMessage.invalidPhoneNumberMessage = '';
    }
    return hasError;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
