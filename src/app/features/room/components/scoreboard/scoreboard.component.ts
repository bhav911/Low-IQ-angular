import { Component, HostListener, inject, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RoomService } from '../../_services/room.service';
import { question, roomQuiz } from '../../models/roomQuiz.mode';
import { User } from '../../../../core/models/User.model';
import { HeaderComponent } from '../quiz/header/header.component';
import { CommonModule } from '@angular/common';
import { Room } from '../../room.model';
import { Subject, takeUntil } from 'rxjs';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-scoreboard',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.css',
})
export class ScoreboardComponent {
  private authService = inject(AuthService);
  private roomService = inject(RoomService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  @Input() roomId!: string;
  quiz: roomQuiz | null = null;
  user: User | null | undefined = undefined;
  questionIndex = signal<number>(0);

  questionPanelOpen = false;
  showFilterOption = false;
  filterType: boolean | null = null;
  answerStatus: boolean[] = [];
  questionPanelList: number[] = [];
  totalCorrectAnswer = 0;
  totalIncorrectAnswer = 0;
  rank = 1;
  loaded = signal<boolean>(false);
  newSubmission = false;
  newSubmissionPlayer: any;
  serverError = '';

  private destroy$ = new Subject<void>();

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event): void {
    this.roomService.leaveRoom();
  }

  ngOnInit(): void {
    this.authService.userValue
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe((user) => {
        this.user = user;
      });

    this.roomService.catchErrors().subscribe((error: any) => {
      this.serverError = error;
      setTimeout(() => {
        this.serverError = '';
      }, 4000);
    });

    this.roomService.$result
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe({
        next: (quizData) => {
          if (!quizData) {
            return;
          }
          this.quiz = quizData;
          this.answerStatus = quizData!.questions.map((que) => {
            const correctOptionId = que.options.find((op) => op.isCorrect)?._id;
            const isCorrect = que.userSelectedOption === correctOptionId;
            this.totalCorrectAnswer += isCorrect ? 1 : 0;
            this.totalIncorrectAnswer += !isCorrect ? 1 : 0;
            return isCorrect;
          });
          this.roomService
            .otherPlayerQuizSubmission()
            .pipe(
              takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
            )
            .subscribe({
              next: (player: any) => {
                this.newSubmissionPlayer = player;
                this.newSubmission = true;
                setTimeout(() => {
                  this.newSubmissionPlayer = null;
                  this.newSubmission = false;
                }, 3000);
              },
            });
          this.loaded.set(true);
        },
      });

    this.roomService.$result
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe({
        next: (room) => {
          if (!room) {
            return;
          }
          this.rank =
            room!.players.findIndex((p) => p.userId === this.user?.userId) + 1;
        },
      });
  }

  get currentQuestionObject() {
    return this.quiz!.questions!.at(this.questionIndex()) as question;
  }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  getOptionClass(optionId: string, index: number) {
    const correctOptionId = this.currentQuestionObject.options.find(
      (o) => o.isCorrect
    )?._id;
    const userSelectedOption = this.currentQuestionObject.userSelectedOption;
    return {
      'fa-check correct-answer': correctOptionId === optionId,
      'fa-xmark incorrect-answer':
        optionId === userSelectedOption &&
        userSelectedOption !== correctOptionId,
      [`option-number fa-${this.convertIndexToLetter(index)}`]:
        optionId !== userSelectedOption && optionId !== correctOptionId,
    };
  }

  jumpToQuestion(questionIndex: number) {
    this.questionIndex.set(questionIndex);
    this.toggleQuestionPanel();
  }

  previousQuestion() {
    this.questionIndex.update((q) => q - 1);
  }

  nextQuestion() {
    this.questionIndex.update((q) => q + 1);
  }

  filterQuestionPanel(correct: boolean | null) {
    this.toggleFilterOptions();
    this.filterType = correct;
    switch (correct) {
      case null: {
        this.questionPanelList = [];
        break;
      }
      case true: {
        this.questionPanelList = this.answerStatus.reduce<number[]>(
          (prev, val, ind) => {
            if (val) {
              prev.push(ind + 1);
            }
            return prev;
          },
          []
        );
        break;
      }
      case false: {
        this.questionPanelList = this.answerStatus.reduce<number[]>(
          (prev, val, ind) => {
            if (!val) {
              prev.push(ind + 1);
            }
            return prev;
          },
          []
        );
        break;
      }
    }
  }

  toggleQuestionPanel() {
    this.questionPanelOpen = !this.questionPanelOpen;
  }

  toggleFilterOptions() {
    this.showFilterOption = !this.showFilterOption;
  }

  ngOnDestroy(): void {
    const url = this.router.url.split('/').slice(1);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    if (url[0] === 'rooms') {
      if (url.length <= 1) {
        this.socketService.removeEventListner('quizStarted');
        this.socketService.removeEventListner('playerJoined');
        this.socketService.removeEventListner('playerLeft');
        this.socketService.removeEventListner('quizFinished');
      }
      this.socketService.removeEventListner('quizSubmitted');
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}
