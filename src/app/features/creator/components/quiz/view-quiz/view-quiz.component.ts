import { CommonModule, Location } from "@angular/common";
import { Component, DestroyRef, inject, Input, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { QuizService } from "../../../../../core/services/quiz.service";
import { AuthService } from "../../../../../core/services/auth.service";
import { quiz } from "../../../../../core/models/quiz.model";
import { User } from "../../../../../core/models/User.model";
import { PublishingRequestsService } from "../../../_service/publishing-requests.service";

@Component({
  selector: 'view-quiz-result',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './view-quiz.component.html',
  styleUrl: './view-quiz.component.css'
})
export class ViewQuizComponent implements OnInit {

  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private publishingRequestsService = inject(PublishingRequestsService);
  private router = inject(Router);
  private onDestroy = inject(DestroyRef);

  @Input() quizId!: string;
  @Input() requestId!: string;
  quiz!: quiz;
  user: User | undefined | null = undefined;
  feedbackForm: FormGroup | null = null;

  loaded = false;
  questionIndex = signal<number>(0);
  categoryTitle = "";
  questionPanelOpen = false
  showDescription = false;

  ngOnInit(): void {


    this.authService.userValue.subscribe(user => {
      this.user = user;
      if (user && user.role === 'admin') {
        this.feedbackForm = new FormGroup({
          feedback: new FormControl("")
        })
      }
    })

    const fields = "_id title questionCount categoryId { _id title } description difficulty questions { _id question point questionImage options { _id isCorrect option } }"
    const s1 = this.quizService.getQuiz(this.quizId, fields).subscribe({
      next: (quizData: any) => {
        this.loaded = true
        this.quiz = quizData;
        this.onDestroy.onDestroy(() => {
          s1.unsubscribe();
        });
      }
    })
  }

  CreateFeedback(status: string) {
    let feedback = this.feedbackForm?.controls['feedback'].value;
    this.publishingRequestsService.createFeedback(this.requestId, feedback, status)
      .subscribe({
        next: success => {
          console.log("Done");
          this.router.navigate(['/admin/request-list']);
        },
        error: err => {
          console.log(err);
        }
      })
  }

  // deleteQuiz() {
  //   this.quizService.deleteQuiz(this.quizId, this.quiz.isEnabled)
  //     .then(data => {
  //       this.router.navigate(['/quizset'], {
  //         replaceUrl: true,
  //         queryParams: {
  //           difficulty: this.quiz.difficulty
  //         }
  //       });
  //     });
  // }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  getOptionClass(index: number): { [key: string]: boolean } {
    return {
      'fa-check correct-answer': this.questionObject.options.at(index)?.isCorrect!,
      [`option-number fa-${this.convertIndexToLetter(index)}`]: !this.questionObject.options.at(index)?.isCorrect!
    };
  }


  get questionObject() {
    return this.quiz.questions[this.questionIndex()]
  }

  jumpToQuestion(questionIndex: number) {
    this.questionIndex.set(questionIndex);
    this.toggleQuestionPanel();
  }

  nextQuestion() {
    this.questionIndex.update(q => q + 1);
  }

  previousQuestion() {
    this.questionIndex.update(q => q - 1);
  }

  toggleQuestionPanel() {
    this.questionPanelOpen = !this.questionPanelOpen;
  }

  toggleDescription() {
    this.showDescription = !this.showDescription;
  }
}
