import {
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  Renderer2,
  signal,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { question, roomQuiz } from '../../models/roomQuiz.mode';
import { User } from '../../../../core/models/User.model';
import { RoomService } from '../../_services/room.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule, HeaderComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
})
export class QuizComponent {
  private router = inject(Router);
  private renderer = inject(Renderer2);

  private authService = inject(AuthService);
  private roomService = inject(RoomService);
  private socketService = inject(SocketService);

  @Input() roomId!: string;
  quiz: roomQuiz | null = null;
  user: User | null | undefined = undefined;
  questionIndex = signal<number>(0);
  userSelectedOptions: {
    [questionId: string]: string;
  } = {};

  quizInvalid = false;
  submittingQuiz = false;
  allAttempted = false;
  panelOpened = false;
  newSubmissionPlayer: any;
  newSubmission = false;
  loaded = signal<boolean>(false);
  serverError = '';
  timePerQuestion = 30;

  private destroy$ = new Subject<void>();

  formattedTime: string = '00:00';
  timer: any;
  @ViewChild('progressBar', { static: false }) progressBar!: ElementRef;

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event): void {
    this.roomService.leaveRoom();
  }

  ngOnInit(): void {
    this.authService.userValue.subscribe((user) => {
      this.user = user;
    });

    this.roomService.$quiz
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe({
        next: (quizData: any) => {
          if (!quizData) {
            return;
          }
          this.quiz = quizData;
          switch (this.quiz?.difficulty) {
            case 'easy': {
              this.timePerQuestion = 45;
              break;
            }
            case 'medium': {
              this.timePerQuestion = 90;
              break;
            }
            case 'hard': {
              this.timePerQuestion = 150;
              break;
            }
          }

          this.formattedTime = `00:${this.timePerQuestion}`;
          this.quiz?.questions.forEach((question) => {
            this.userSelectedOptions[question._id] = '';
          });
          this.startTimer(Date.now() + (this.timePerQuestion + 1) * 1000);
          this.loaded.set(true);
        },
      });

    this.roomService.catchErrors().subscribe((error: any) => {
      this.serverError = error;
      setTimeout(() => {
        this.serverError = '';
      }, 4000);
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
  }

  startTimer(expiresAt: number) {
    this.timer = setInterval(() => {
      const remainingTime = Math.max(0, expiresAt - Date.now());
      this.formattedTime = this.formatTime(remainingTime);
      if (remainingTime === 0) {
        clearInterval(this.timer);
        if (this.questionIndex() < this.quiz!.questionCount - 1) {
          this.nextQuestion();
        } else {
          this.onSubmit();
        }
      }
    }, 1000);
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }

  get currentQuestionObject() {
    return this.quiz!.questions!.at(this.questionIndex()) as question;
  }

  selectedOption(optionId: string) {
    if (
      this.userSelectedOptions[this.currentQuestionObject?._id] === optionId
    ) {
      this.userSelectedOptions[this.currentQuestionObject?._id] = '';
      this.modifyProgressBar();
      this.allAttempted = false;
    } else {
      this.userSelectedOptions[this.currentQuestionObject?._id] = optionId;
      this.modifyProgressBar();
      const attemptedQuestions = Object.values(this.userSelectedOptions).reduce(
        (prev, cur) => {
          return prev + (cur === '' ? 0 : 1);
        },
        0
      );
      if (attemptedQuestions === this.quiz!.questionCount) {
        setTimeout(() => {
          this.allAttempted = true;
        }, 200);
      }
    }
  }

  modifyProgressBar() {
    const questionAttempted = Object.values(this.userSelectedOptions).reduce(
      (prev, cur) => {
        return prev + (cur === '' ? 0 : 1);
      },
      0
    );
    const progressWidth = (questionAttempted / this.quiz?.questionCount!) * 100;
    this.renderer.setStyle(
      this.progressBar.nativeElement,
      'width',
      `${progressWidth}%`
    );
  }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  async onSubmit() {
    clearInterval(this.timer);
    if (this.submittingQuiz) {
      return;
    }
    this.submittingQuiz = true;
    const userAnswers = Object.entries(this.userSelectedOptions).map(
      ([questionId, optionId]) => {
        return {
          questionId,
          optionId,
        };
      }
    );

    const status = await this.roomService.submitQuiz(this.roomId, userAnswers);
    if (status) {
      this.router.navigate(['/rooms', this.roomId, 'scoreboard']);
    }
  }

  nextQuestion() {
    clearInterval(this.timer);
    this.startTimer(Date.now() + (this.timePerQuestion + 1) * 1000);
    this.questionIndex.update((q) => q + 1);
    this.formattedTime = `00:${this.timePerQuestion}`;
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }

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
