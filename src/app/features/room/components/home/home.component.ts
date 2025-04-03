import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RoomService } from '../../_services/room.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Room } from '../../room.model';
import { RoomTemplateComponent } from './room-template/room-template.component';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RoomTemplateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private roomService = inject(RoomService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private isFormSubmitted = false;
  showDifficultyPanel = false;
  showCreateRoomComponent = false;
  isCreatingRoom = false;
  isJoiningRoom = false;

  errorMessage = {
    titleErrorMessage: '',
    difficultyErrorMessage: '',
    participantErrorMessage: '',
    questionCountErrorMessage: '',
    roomIdErrorMessage: '',
    roomPasswordMessage: '',
  };

  serverError = '';

  publicRooms: Room[] = [];

  createRoomForm = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(250)],
    }),
    difficulty: new FormControl('easy'),
    participants: new FormControl(10),
    question_count: new FormControl(15),
    private: new FormControl<boolean>(true),
  });

  joinRoomForm = new FormGroup({
    roomId: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    password: new FormControl(''),
  });

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event): void {
    this.socketService.removeEventListner('newRoom');
  }

  ngOnInit(): void {
    this.roomService.$publicRooms.subscribe((rooms) => {
      this.publicRooms = rooms;
    });
    this.roomService.fetchInitialRooms();
    this.roomService.catchErrors().subscribe((error: any) => {
      this.serverError = error;
      this.isCreatingRoom = false;
      this.isJoiningRoom = false;
      setTimeout(() => {
        this.serverError = '';
      }, 4000);
    });
  }

  get crf() {
    return this.createRoomForm.controls;
  }

  get jrf() {
    return this.joinRoomForm.controls;
  }

  async createRoom() {
    this.isFormSubmitted = true;
    if (
      this.invalidQuizTitle() ||
      this.invalidQuestionCount() ||
      this.invalidMaxParticipants()
    ) {
      return;
    }

    this.isCreatingRoom = true;

    const title = this.crf.title.value!;
    const difficulty = this.crf.difficulty.value!;
    const participants = this.crf.participants.value!;
    const isPrivate = this.crf.private.value!;
    const question_count = this.crf.question_count.value!;

    const room = await this.roomService.createRoom(
      title,
      difficulty,
      participants,
      question_count,
      isPrivate
    );

    this.isCreatingRoom = false;

    if (room) {
      this.router.navigate(['/rooms', room.roomId]);
    }
  }

  async joinRoom() {
    this.isFormSubmitted = true;
    if (this.invalidRoomId() || this.invalidRoomPassword()) {
      return;
    }

    if (!this.authService.directUserValue) {
      this.router.navigate(['/signup'], {
        state: {
          redirectTo: `/rooms/${this.jrf.roomId.value}`,
        },
      });
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

  updateDifficulty(value: string) {
    this.crf.difficulty.setValue(value);
    this.toggleDifficultyPanel();
  }

  incrementCount(
    field: keyof typeof this.createRoomForm.controls,
    value: number
  ) {
    if (field === 'difficulty' || field === 'private' || field === 'title') {
      return;
    }
    const cur_count = this.crf[field].value ?? 0;
    this.crf[field].setValue(cur_count + value);
  }

  toggleDifficultyPanel() {
    this.showDifficultyPanel = !this.showDifficultyPanel;
  }

  toggleCreateRoom() {
    if (!this.showCreateRoomComponent) {
      if (!this.authService.directUserValue) {
        this.router.navigate(['/signup'], {
          state: {
            redirectTo: `/rooms`,
          },
        });
        return;
      }
    }
    this.showCreateRoomComponent = !this.showCreateRoomComponent;
  }

  invalidQuizTitle() {
    const title = this.crf.title;
    const hasError =
      (title.touched && title.dirty && title.invalid) ||
      (this.isFormSubmitted && title.invalid);
    if (hasError) {
      if (title.hasError('maxlength')) {
        this.errorMessage.titleErrorMessage = 'Title is too long';
      } else if (title.hasError('required')) {
        this.errorMessage.titleErrorMessage = 'Title is required';
      }
    } else {
      this.errorMessage.titleErrorMessage = '';
    }
    return hasError;
  }

  invalidMaxParticipants() {
    const maxParticipants = this.crf.participants.value;
    let hasError;
    if (!maxParticipants) {
      this.errorMessage.participantErrorMessage = 'value required';
      hasError = true;
      return hasError;
    }
    if (maxParticipants < 1 || maxParticipants > 50) {
      this.crf.participants.setValue(10);
      hasError = true;
    } else {
      hasError = false;
      this.errorMessage.participantErrorMessage = '';
    }
    if (hasError) {
      this.errorMessage.participantErrorMessage =
        'value should be between 1 to 50';
      setTimeout(() => {
        this.errorMessage.participantErrorMessage = '';
      }, 2000);
    }
    return hasError;
  }

  invalidQuestionCount() {
    const question_count = this.crf.question_count.value;
    let hasError;
    if (!question_count) {
      this.errorMessage.questionCountErrorMessage = 'value required';
      hasError = true;
      return hasError;
    }
    if (question_count < 1) {
      hasError = true;
      this.crf.question_count.setValue(1);
    } else if (question_count > 50) {
      hasError = true;
      this.crf.question_count.setValue(50);
    } else {
      this.errorMessage.questionCountErrorMessage = '';
      return false;
    }
    this.errorMessage.questionCountErrorMessage =
      'value should be between 1 to 50';
    setTimeout(() => {
      this.errorMessage.questionCountErrorMessage = '';
    }, 2000);
    return hasError;
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

  ngOnDestroy() {
    const url = this.router.url.split('/').slice(1);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    if (url[0] === 'rooms') {
      return;
    }
    this.socketService.removeEventListner('newRoom');
  }
}
