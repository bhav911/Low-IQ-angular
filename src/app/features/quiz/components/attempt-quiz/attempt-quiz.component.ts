import { CommonModule } from "@angular/common";
import { Component, computed, ElementRef, inject, Input, OnInit, Renderer2, signal, ViewChild } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { HeaderComponent } from "./header/header.component";
import { QuizService } from "../../../../core/services/quiz.service";
import { AuthService } from "../../../../core/services/auth.service";
import { question, quiz } from "../../../../core/models/quiz.model";
import { User } from "../../../../core/models/User.model";
import { Router } from "@angular/router";


@Component({
  selector: 'app-attempt-quiz',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent],
  templateUrl: './attempt-quiz.component.html',
  styleUrl: './attempt-quiz.component.css'
})
export class AttemptQuizComponent implements OnInit {

  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private route = inject(Router);
  private renderer = inject(Renderer2);

  @Input() quizId!: string;
  quiz: quiz | null = null;
  user: User | null | undefined = undefined
  questionIndex = signal<number>(0);
  userSelectedOptions: {
    [questionId: string]: string
  } = {};
  questionStatus = signal<number[]>([]);

  cssClasses = [
    {
      css: 'not-visited',
      text: 'Not Visited Yet'
    },
    {
      css: 'current-question',
      text: 'Current Question'
    },
    {
      css: 'attempted',
      text: 'Attempted'
    },
    {
      css: 'not-attempted',
      text: 'Visited but not attempted'
    },
  ]
  quizInvalid = false;
  submittingQuiz = false;
  allAttempted = false;
  questionPanelOpen = false;
  showFilterOption = false;
  panelOpened = false;
  showLoginModal = false;
  filterType = signal<number>(-1);
  loaded = signal<boolean>(false);
  @ViewChild('progressBar', { static: false }) progressBar!: ElementRef;

  ngOnInit(): void {
    this.authService.userValue
      .subscribe(user => {
        this.user = user;
      })

    const fields = "_id title difficulty questionCount questions { _id question questionImage point options { _id option } }";
    this.quizService.getQuiz(this.quizId, fields).subscribe({
      next: (quizData: any) => {
        this.quiz = quizData;
        this.questionStatus.set(new Array(this.quiz?.questionCount).fill(0));

        this.quiz?.questions.forEach(question => {
          this.userSelectedOptions[question._id] = ""
        })

        setTimeout(() => {
          this.loaded.set(true);
          this.updateQuestionStatus(0, 2);
        }, 2000);
      }
    })
  }

  panel_notVisited = computed(() => this.questionStatus().filter((val) => val === 0).length)
  panel_attempted = computed(() => this.questionStatus().filter((val) => val === 1).length)
  panel_visitedNotAttempted = computed(() => this.questionStatus().filter((val) => val === 2).length)
  questionPanelList = computed(() => {
    switch (this.filterType()) {
      case -1:
        return [];
      case 0:
        return this.questionStatus().reduce<number[]>((prev, val, ind) => {
          if (val === 0) {
            prev.push(ind + 1);
          }
          return prev;
        }, []);
      case 1:
        return this.questionStatus().reduce<number[]>((prev, val, ind) => {
          if (val === 1) {
            prev.push(ind + 1);
          }
          return prev;
        }, []);
      case 2:
        return this.questionStatus().reduce<number[]>((prev, val, ind) => {
          if (val === 2) {
            prev.push(ind + 1);
          }
          return prev;
        }, []);
      default:
        return [];
    }
  });
  filterName = computed(() => {
    switch (this.filterType()) {
      case 0: return 'Not visited';
      case 1: return 'Attempted';
      case 2: return 'Visited but not attempted';
      default: return 'All';
    }
  })

  get currentQuestionObject() {
    return this.quiz!.questions!.at(this.questionIndex()) as question;
  }

  selectedOption(optionId: string) {
    if (this.userSelectedOptions[this.currentQuestionObject?._id] === optionId) {
      this.userSelectedOptions[this.currentQuestionObject?._id] = "";
      this.updateQuestionStatus(this.questionIndex(), 0);
      this.modifyProgressBar()
      this.allAttempted = false;
    }
    else {
      this.userSelectedOptions[this.currentQuestionObject?._id] = optionId
      this.updateQuestionStatus(this.questionIndex(), 1);
      this.modifyProgressBar()
      const attemptedQuestions = Object.values(this.userSelectedOptions).reduce((prev, cur) => {
        return prev + (cur === "" ? 0 : 1)
      }, 0)
      if (attemptedQuestions === this.quiz!.questionCount) {
        setTimeout(() => {
          this.allAttempted = true;
        }, 200);
      }
    }
  }

  modifyProgressBar() {
    const questionAttempted = Object.values(this.userSelectedOptions).reduce((prev, cur) => {
      return prev + (cur === "" ? 0 : 1)
    }, 0)
    const progressWidth =
      (questionAttempted / this.quiz?.questionCount!) * 100;
    this.renderer.setStyle(this.progressBar.nativeElement, 'width', `${progressWidth}%`);
  }

  updateQuestionStatus(index: number, newValue: number) {
    this.questionStatus.set(
      this.questionStatus().map((val, i) => (i === index ? newValue : val))
    );
  }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  jumpToQuestion(questionIndex: number) {
    this.toggleQuestionPanel();
    this.questionIndex.set(questionIndex);
    this.checkIfNotAttempted();
  }

  onSubmit() {
    if (this.submittingQuiz || this.questionStatus().some((status) => status === 2 || status === 0)) {
      this.quizInvalid = true;
      setTimeout(() => {
        this.quizInvalid = false;
      }, 3000);
      return;
    }

    this.submittingQuiz = true;

    const userAnswers = Object.entries(this.userSelectedOptions).map(([questionId, optionId]) => {
      return {
        questionId,
        optionId
      }
    });

    this.quizService.submitQuiz(this.quizId, userAnswers)
      .subscribe(resultId => {
        this.route.navigate(['result', resultId], {
          replaceUrl: true
        });
      })
  }

  checkIfNotAttempted() {
    if (this.questionStatus()[this.questionIndex()] == 0) {
      this.updateQuestionStatus(this.questionIndex(), 2);
    }
  }

  nextQuestion() {
    this.questionIndex.update(q => q + 1);
    this.checkIfNotAttempted()
  }

  previousQuestion() {
    this.questionIndex.update(q => q - 1);
    this.checkIfNotAttempted();
  }

  userRegistered(status: boolean) {
    this.onSubmit()
  }

  filterQuestionPanel(index: number) {
    this.toggleFilterOptions();
    this.filterType.set(index)
  }

  toggleQuestionPanel() {
    this.panelOpened = true;
    this.questionPanelOpen = !this.questionPanelOpen;
    this.showFilterOption = false;
  }

  toggleFilterOptions() {
    this.showFilterOption = !this.showFilterOption;
  }

  toggleLoginModal() {
    this.showLoginModal = !this.showLoginModal
  }
}
