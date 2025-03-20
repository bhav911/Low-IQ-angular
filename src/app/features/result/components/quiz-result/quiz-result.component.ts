import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Result } from "../../../../core/models/result.model";
import { ResultService } from "../../_services/result.service";

@Component({
  selector: 'app-quiz-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz-result.component.html',
  styleUrl: './quiz-result.component.css'
})
export class QuizResultComponent implements OnInit {

  @Input() resultId: string | null = null;
  result: Result | null = null;
  questionIndex = signal<number>(0);
  answerStatus: boolean[] = []
  questionPanelList: number[] = [];
  cssClasses = [
    {
      css: 'bg-success text-white',
      text: 'Correct Answer'
    },
    {
      css: 'bg-danger text-white',
      text: 'Incorrect Answer'
    },
    {
      css: 'rounded-5 border border-dark',
      text: 'Current Question'
    }
  ]
  loaded = signal<boolean>(false);
  showDetails = signal<boolean>(false);
  questionPanelOpen = false
  showFilterOption = false;
  totalCorrectAnswer = 0;
  totalIncorrectAnswer = 0;
  filterType: boolean | null = null;

  private resultService = inject(ResultService);

  ngOnInit(): void {
    this.resultService.getResult(this.resultId!)
      .subscribe({
        next: (result: Result) => {
          this.result = result;

          this.answerStatus = result.quizId!.questions.map(que => {
            const correctOptionId = que.options.find(op => op.isCorrect)?._id
            const isCorrect = result.userAnswers.find(i => i.questionId === que._id)?.optionId === correctOptionId
            this.totalCorrectAnswer += isCorrect ? 1 : 0
            this.totalIncorrectAnswer += !isCorrect ? 1 : 0
            return isCorrect;
          });

          this.loaded.set(true);
        }
      })
  }

  getOptionClass(optionId: string, index: number) {
    const correctOptionId = this.currentQuestionObject.options.find(o => o.isCorrect)?._id;
    const userSelectedOption = this.result?.userAnswers.find(i => i.questionId === this.currentQuestionObject._id)?.optionId;
    return {
      'fa-check correct-answer': correctOptionId === optionId,
      'fa-xmark incorrect-answer': optionId === userSelectedOption && userSelectedOption !== correctOptionId,
      [`option-number fa-${this.convertIndexToLetter(index)}`]: optionId !== userSelectedOption && optionId !== correctOptionId,
    };
  }

  flipDetails() {
    this.showDetails.set(!this.showDetails())
  }

  get currentQuestionObject() {
    return this.result!.quizId!.questions[this.questionIndex()];
  }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
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

  filterQuestionPanel(correct: boolean | null) {
    this.toggleFilterOptions();
    this.filterType = correct
    switch (correct) {
      case null: {
        this.questionPanelList = [];
        break;
      }
      case true: {
        this.questionPanelList = this.answerStatus.reduce<number[]>((prev, val, ind) => {
          if (val) {
            prev.push(ind + 1);
          }
          return prev;
        }, [])
        break;
      }
      case false: {
        this.questionPanelList = this.answerStatus.reduce<number[]>((prev, val, ind) => {
          if (!val) {
            prev.push(ind + 1);
          }
          return prev;
        }, [])
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
}
