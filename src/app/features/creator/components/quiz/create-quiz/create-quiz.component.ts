import { CommonModule, Location } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, of, Subject, take } from 'rxjs';
import { Router } from '@angular/router';
import { QuizTemplateComponent } from './quiz-template/quiz-template.component';
import { QuizService } from '../../../../../core/services/quiz.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { CategoryService } from '../../../../category/_services/category.service';
import { quiz, question } from '../../../../../core/models/quiz.model';
import { category } from '../../../../../core/models/category.model';
import { QuestionStruct } from '../../../../../core/models/question.model';
import { genQuestionModel } from '../../../../../core/models/generatedQuestion.model';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, QuizTemplateComponent],
  templateUrl: './create-quiz.component.html',
  styleUrl: './create-quiz.component.css',
})
export class CreateQuizComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private quizService = inject(QuizService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  @ViewChild('descriptionField')
  descriptionField!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('newCategoryValue')
  newCategoryField!: ElementRef<HTMLInputElement>;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  minimunQuestions = 5;
  quizForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    note: ['', [Validators.maxLength(500)]],
    difficulty: ['Difficulty', [Validators.required]],
    category: ['Category', [Validators.required]],
    questions: this.fb.array([]),
  });
  quiz: quiz | null = null;
  categories: category[] = [];
  isRotated = [false, false, false];
  formInvalid = signal(false);
  activeQuestionIndex = signal<number | null>(null);

  quizId = input<string | null>(null);
  toEdit = false;
  disableFields = false;
  isFormSubmitted = false;
  hideQuizMeta = false;
  highLightError = false;
  showGeminiPrompt = false;
  formSubmissionInProcess = false;
  quizGenerationInProcess = false;
  showNewCategoryField = true;

  // Error-Messages
  titleErrorMessage: string | null = null;
  descriptionErrorMessage: string | null = null;
  difficultyErrorMessage: string | null = null;
  categoryErrorMessage: string | null = null;

  constructor() {
    this.qf['title'].valueChanges.subscribe(() => {
      this.invalidQuizTitle();
    });
    this.qf['description'].valueChanges.subscribe(() => {
      this.adjustHeight();
      this.invalidQuizDescription();
    });
    this.qf['difficulty'].valueChanges.subscribe(() => {
      this.invalidQuizDifficulty();
    });
    this.qf['category'].valueChanges.subscribe(() => {
      this.invalidQuizCategory();
    });
  }

  ngOnInit(): void {
    this.categoryService
      .getAllCategories('_id title', 'create')
      .subscribe((next: any) => {
        if (next) {
          this.categories = next;
        }
      });
    if (this.quizId()) {
      this.toEdit = true;
      const fields =
        '_id title questionCount meta { attempted } categoryId { _id title } description difficulty questions { _id question point questionImage options { _id isCorrect option } }';
      this.quizService.getQuiz(this.quizId()!, fields).subscribe({
        next: (quizData: any) => {
          if (quizData) {
            this.quizForm.controls['category'].disable();
            this.quizForm.controls['difficulty'].disable();
            if (quizData.meta.attempted > 0) {
              this.disableFields = true;
              this.quizForm.controls['questions'].disable();
            }
            this.quiz = quizData;
            this.quizForm.controls['category'].patchValue(
              this.quiz?.categoryId._id!
            );
            for (let i = 0; i < quizData.questionCount; i++) {
              this.addQuestion(quizData.questions.at(i));
            }
            this.toEdit = false;
            this.activeQuestionIndex.set(0);
            this.quizForm.patchValue(this.quiz!);
          }
        },
      });
    }
  }

  private adjustHeight(): void {
    const textarea = this.descriptionField.nativeElement;
    textarea.style.height = 'auto'; // Reset height to auto
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height to the scrollHeight
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getQuestion = computed(
    () =>
      this.questions.at(
        this.activeQuestionIndex()!
      ) as FormGroup<QuestionStruct>
  );

  removeChild(index: number) {
    this.questions.removeAt(index);
    if (this.questions.length === 0) {
      this.activeQuestionIndex.set(null);
    } else {
      this.activeQuestionIndex.set(index === 0 ? index + 1 : index - 1);
    }
  }

  swipeQuestion(swipe: number) {
    this.activeQuestionIndex.set(this.activeQuestionIndex()! + swipe);
  }

  options(index: number) {
    return this.questions.at(index).get('options') as FormArray;
  }

  areQuestionsValid() {
    let isValid = true;
    this.questions.controls.forEach((question, ind: number) => {
      if (!isValid) {
        return;
      }
      if (question.invalid) {
        isValid = false;
        this.highLightError = true;
        this.activeQuestionIndex.set(ind);
        setTimeout(() => {
          this.highLightError = false;
        }, 2000);
      }
    });
    return isValid;
  }

  isQuizMetaInvalid() {
    let invalidTitle = this.invalidQuizTitle(true);
    let invalidDescription = this.invalidQuizDescription(true);
    let invalidCategory = this.invalidQuizCategory();
    let invalidDifficulty = this.invalidQuizDifficulty();

    let isInvalid =
      invalidTitle ||
      invalidDescription ||
      invalidCategory ||
      invalidDifficulty;
    if (isInvalid) {
      this.hideQuizMeta = false;
    }
    return isInvalid;
  }

  addQuestion(question?: question) {
    if (!this.areQuestionsValid()) {
      return;
    }

    const questionForm = this.fb.group({
      question: [
        question?.question ?? '',
        [Validators.required, Validators.maxLength(500)],
      ],
      options: this.fb.array([
        this.fb.group({
          option: ['', [Validators.required, Validators.maxLength(250)]],
          isCorrect: [false, Validators.required],
        }),
        this.fb.group({
          option: ['', [Validators.required, Validators.maxLength(250)]],
          isCorrect: [false, Validators.required],
        }),
        this.fb.group({
          option: ['', [Validators.required, Validators.maxLength(250)]],
          isCorrect: [false, Validators.required],
        }),
        this.fb.group({
          option: ['', [Validators.required, Validators.maxLength(250)]],
          isCorrect: [false, Validators.required],
        }),
      ]),
      point: [
        question?.point ?? 1,
        [Validators.required, Validators.min(1), Validators.max(10)],
      ],
      questionImage: [question?.questionImage ?? ''],
    });

    if (question) {
      const optionsArray = questionForm.get('options') as FormArray;
      optionsArray.clear();

      question.options.forEach((option) => {
        optionsArray.push(
          this.fb.group({
            option: [
              option.option,
              [Validators.required, Validators.maxLength(100)],
            ],
            isCorrect: [option.isCorrect, Validators.required],
          })
        );
      });
    }

    if (this.disableFields) {
      questionForm.disable();
    }
    this.questions.push(questionForm);
    this.activeQuestionIndex.set(this.questions.length - 1);
  }

  get qf() {
    return this.quizForm.controls;
  }

  get currectCategory() {
    let category = this.qf.category.value;
    return (
      this.categories
        .find((c) => c._id === category)
        ?.title.split('-')
        .join(' ') ?? 'Category'
    );
  }

  onSubmit() {
    if (this.isQuizMetaInvalid() || !this.areQuestionsValid()) {
      return;
    }

    if (this.qf.category.value!.startsWith('new-->')) {
      this.qf.category.setValue(this.qf.category.value!.slice(6));
    }

    this.formSubmissionInProcess = true;

    const questions = this.qf.questions as FormArray;
    const questionCount = questions.length;
    const quizObject: any = {
      _id: this.quizId() ?? undefined,
      title: this.qf.title.value!.trim(),
      categoryId: this.qf.category.value!,
      description: this.qf.description.value!.trim(),
      note: this.qf.note.value!.trim() ?? undefined,
      difficulty: this.qf.difficulty.value as 'easy' | 'medium' | 'hard',
      questions: [],
    };

    for (let i = 0; i < questionCount; i++) {
      const question = questions.at(i) as FormGroup<QuestionStruct>;
      const options = [];
      for (const option of question.controls.options.controls) {
        options.push({
          option: option.value.option!,
          isCorrect: option.value.isCorrect!,
        });
      }

      quizObject.questions.push({
        question: question.get('question')?.value!,
        options: options,
        point: question.get('point')?.value!,
        questionImage: question.get('questionImage')?.value!,
      });
    }

    this.addOrEdit(quizObject).subscribe({
      next: (quizId) => {
        this.router.navigate(
          ['/creator', 'quiz', this.quizId() ? this.quizId() : quizId, 'view'],
          {
            replaceUrl: true,
          }
        );
      },
      error: (err) => {
        this.formSubmissionInProcess = false;
        console.log(err);
      },
    });
  }

  addOrEdit(quizData: quiz): Observable<any> {
    return quizData._id
      ? this.quizService.updateQuiz(quizData)
      : this.quizService.createQuiz(quizData);
  }

  invalidQuizTitle(highlight?: boolean) {
    const title = this.qf.title;
    const hasError =
      (title.touched && title.dirty && title.invalid) ||
      (this.isFormSubmitted && title.invalid) ||
      (title.invalid && highlight);
    if (hasError) {
      if (title.hasError('maxlength')) {
        this.titleErrorMessage = 'Title is too long';
      } else if (title.hasError('required')) {
        this.titleErrorMessage = 'Title is required';
      }
    } else {
      this.titleErrorMessage = null;
    }
    return hasError;
  }

  invalidQuizDescription(highlight?: boolean) {
    const description = this.qf.description;
    const hasError =
      (description.touched && description.dirty && description.invalid) ||
      (this.isFormSubmitted && description.invalid) ||
      (description.invalid && highlight);
    if (hasError) {
      if (description.hasError('maxlength')) {
        this.descriptionErrorMessage = 'Description is too long';
      } else if (description.hasError('required')) {
        this.descriptionErrorMessage = 'Description is required';
      }
    } else {
      this.descriptionErrorMessage = null;
    }
    return hasError;
  }

  invalidQuizDifficulty() {
    const difficulty = this.qf.difficulty.value!;
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      this.difficultyErrorMessage = 'Please Select Difficulty';
      return true;
    } else {
      this.difficultyErrorMessage = null;
      return false;
    }
  }

  invalidQuizCategory() {
    const category = this.qf.category.value;
    let exist =
      this.categories.find((c) => c._id === category) || category === 'new';
    this.categoryErrorMessage = exist ? null : 'Please Select Category';
    if (this.categoryErrorMessage) {
      this.isRotated.fill(false);
    }
    return !exist;
  }

  toggleRotation(index: number): void {
    let state = this.isRotated[index];
    this.isRotated.fill(false);
    this.isRotated[index] = !state;
  }

  toggleQuizMeta() {
    this.hideQuizMeta = !this.hideQuizMeta;
  }

  updateFilter(type: 'difficulty' | 'category', value: string) {
    this.qf[type].setValue(value);
    this.isRotated.fill(false);
  }

  generateGeminiQuiz(
    quizDescription: string,
    numberOfQuestion: number,
    difficulty: string
  ) {
    if (this.quizGenerationInProcess || quizDescription.length === 0) {
      return;
    }
    numberOfQuestion = numberOfQuestion > 10 ? 10 : numberOfQuestion;
    this.quizGenerationInProcess = true;
    this.quizService
      .generateQuiz(quizDescription, numberOfQuestion, difficulty)
      .subscribe((quiz: genQuestionModel) => {
        this.qf.title.setValue(quiz.title);
        this.qf.description.setValue(quiz.description);
        this.qf.difficulty.setValue(quiz.difficulty);
        for (let questionData of quiz.questions) {
          this.addQuestion(questionData);
        }
        this.quizGenerationInProcess = false;
        this.toggleGeminiPromt();
      });
  }

  addNewCategory(newCategory: string) {
    this.categories.unshift({
      _id: `new-->${newCategory}`,
      title: newCategory,
      icon: '',
      creatorId: 'new',
    });
    this.showNewCategoryField = false;
    this.updateFilter('category', `new-->${newCategory}`);
  }

  editNewCategory(categoryId: string) {
    // this.qf['category'].setValue('');
    let category = this.categories.find((c) => c._id === categoryId);
    this.categories = this.categories.filter((c) => c._id !== categoryId);
    this.showNewCategoryField = true;
    setTimeout(() => {
      this.newCategoryField.nativeElement.value = category?.title!;
    }, 10);
  }

  toggleGeminiPromt() {
    this.showGeminiPrompt = !this.showGeminiPrompt;
  }

  getRange(index: number) {
    return new Array(index);
  }
}
