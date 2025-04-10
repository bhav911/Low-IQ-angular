import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Room } from '../../room.model';
import { RoomService } from '../../_services/room.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/models/User.model';
import { AuthService } from '../../../../core/services/auth.service';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { SocketService } from '../../../../core/services/socket.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-lobby',
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css',
})
export class LobbyComponent implements OnInit {
  private roomService = inject(RoomService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private router = inject(Router);

  room!: Room;
  roomId!: string;
  user!: User | null;
  roomSubscription!: Subscription;

  openModifyDifficulty = false;
  openModifyNumOfQuestion = false;
  showDifficultyPanel = false;
  isStarting = false;
  questionCountErrorMessage = '';
  serverError = '';

  private destroy$ = new Subject<void>();

  roomForm = new FormGroup({
    difficulty: new FormControl('Difficulty'),
    questionCount: new FormControl(5),
  });

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event): void {
    this.roomService.leaveRoom(this.room.roomId);
  }

  ngOnInit(): void {
    this.roomSubscription = this.authService.$user
      .pipe(
        filter((u) => u !== undefined),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.user = user;
      });
    this.roomService.$joinedRoom
      .pipe(takeUntil(this.destroy$))
      .subscribe((room) => {
        if (!room) {
          return;
        }
        this.room = room!;
        if (room) {
          this.roomId = room.roomId;
        }
        this.roomForm.patchValue({
          difficulty: room!.difficulty,
          questionCount: +room!.questionCount,
        });
      });
    this.roomService.catchErrors().subscribe((error: any) => {
      this.serverError = error;
      setTimeout(() => {
        this.serverError = '';
      }, 4000);
    });
  }

  startQuiz() {
    this.isStarting = true;
    const difficulty = this.crf.difficulty.value || 'easy';
    const questionCount = this.crf.questionCount.value || 10;
    this.roomService.startQuiz(difficulty, questionCount);
  }

  get crf() {
    return this.roomForm.controls;
  }

  leaveRoom() {
    this.roomService.leaveRoom(this.room.roomId);
    this.router.navigate(['/rooms']);
  }

  updateDifficulty(value: string) {
    this.crf.difficulty.setValue(value);
    this.openModifyDifficulty = false;
    this.showDifficultyPanel = false;
    this.openModifyNumOfQuestion = false;
  }

  incrementCount(field: keyof typeof this.roomForm.controls, value: number) {
    if (field === 'difficulty') {
      return;
    }
    const cur_count = this.crf[field].value ?? 0;
    this.crf[field].setValue(cur_count + value);
  }

  toggleDifficulty() {
    this.openModifyDifficulty = !this.openModifyDifficulty;
  }

  toggleNumberOfParticipants() {
    this.openModifyNumOfQuestion = !this.openModifyNumOfQuestion;
  }

  toggleDifficultyPanel() {
    this.showDifficultyPanel = !this.showDifficultyPanel;
  }

  invalidQuestionCount() {
    const questionCount = this.crf.questionCount.value;
    let hasError;
    if (!questionCount) {
      this.questionCountErrorMessage = 'value required';
      hasError = true;
      return hasError;
    }
    if (questionCount < 1) {
      hasError = true;
      this.crf.questionCount.setValue(1);
    } else if (questionCount > 50) {
      hasError = true;
      this.crf.questionCount.setValue(50);
    } else {
      this.questionCountErrorMessage = '';
      return false;
    }
    this.questionCountErrorMessage = 'value should be between 1 to 50';
    setTimeout(() => {
      this.questionCountErrorMessage = '';
    }, 2000);
    return hasError;
  }

  ngOnDestroy() {
    const url = this.router.url.split('/').slice(1);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    if (url[0] === 'rooms' && url[2] === 'in-progress') {
      return;
    }

    this.roomService.leaveRoom(this.roomId);
    this.socketService.removeEventListner('playerJoined');
    this.socketService.removeEventListner('playerLeft');
    this.socketService.removeEventListner('quizStarted');
    this.socketService.removeEventListner('quizFinished');
    this.socketService.removeEventListner('newRoom');
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}
