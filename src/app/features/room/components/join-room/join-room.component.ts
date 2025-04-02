import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RoomService } from '../../_services/room.service';
import { Router } from '@angular/router';
import { SocketService } from '../../../../core/services/socket.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-join-room',
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent implements OnInit {
  private roomService = inject(RoomService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  roomId = input<string>();
  private isFormSubmitted = false;
  isJoiningRoom = false;

  serverError = '';

  errorMessage = {
    roomIdErrorMessage: '',
    roomPasswordMessage: '',
  };

  joinRoomForm = new FormGroup({
    roomId: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    password: new FormControl(''),
  });

  ngOnInit(): void {
    if (this.roomId()) {
      this.joinRoomForm.controls.roomId.setValue(this.roomId()!);
    }
    this.roomService.catchErrors().subscribe((error: any) => {
      this.serverError = error;
      setTimeout(() => {
        this.serverError = '';
      }, 4000);
    });
  }

  get jrf() {
    return this.joinRoomForm.controls;
  }

  async joinRoom() {
    this.isFormSubmitted = true;
    if (this.invalidRoomId() || this.invalidRoomPassword()) {
      return;
    }
    this.isJoiningRoom = true;

    const roomId = this.jrf.roomId.value!;
    const password = this.jrf.password.value!;

    const room = await this.roomService.joinRoom(roomId, password);
    this.isJoiningRoom = false;
    if (room) {
      this.router.navigate(['/rooms', room.roomId]);
    }
  }

  invalidRoomId() {
    const roomId = this.jrf.roomId;
    const hasError =
      (roomId.touched && roomId.dirty && roomId.invalid) ||
      (this.isFormSubmitted && roomId.invalid);
    if (hasError) {
      if (roomId.hasError('minlength')) {
        this.errorMessage.roomIdErrorMessage = 'Room ID is of length 6';
      } else if (roomId.hasError('required')) {
        this.errorMessage.roomIdErrorMessage = 'Room ID is required';
      }
    } else {
      this.errorMessage.roomIdErrorMessage = '';
    }
    return hasError;
  }

  invalidRoomPassword() {
    const password = this.jrf.password;
    const hasError = Boolean(password.value) && password.value?.length != 8;
    if (hasError) {
      this.errorMessage.roomPasswordMessage = 'Room password is of length 8';
    } else {
      this.errorMessage.roomPasswordMessage = '';
    }
    return hasError;
  }
}
