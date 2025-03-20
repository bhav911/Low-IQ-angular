import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { QuestionStruct } from '../../../../../../core/models/question.model';

@Component({
  selector: 'app-quiz-template',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './quiz-template.component.html',
  styleUrl: './quiz-template.component.css'
})
export class QuizTemplateComponent implements OnInit, OnChanges {

  @Input() questionForm!: FormGroup<QuestionStruct>;
  @Input() $index!: number;
  @Input() highLightError!: boolean;
  @Output() deleteChild = new EventEmitter();
  isDisabled: boolean = false;
  isFormSubmitted = false;

  optionFormArray!: FormArray;
  questionErrorMessage: string | null = null
  optionsErrorMessage: (string | null)[] = new Array(4).fill(null);
  correctOptionErrorMessage: string | null = null
  pointErrorMessage: string | null = null
  question_media_preview: string | null = null;

  @ViewChild('questionField') questionField !: ElementRef<HTMLInputElement>

  ngOnChanges(changes: SimpleChanges): void {
    if (this.qf.questionImage) {
      this.question_media_preview = this.qf.questionImage.value
    }
    setTimeout(() => {
      this.adjustHeight();
    }, 10);
    this.invalidQuestion();
    this.invalidQuestionPoint();
    this.getRange(4).forEach((val, ind) => {
      this.invalidOptions(ind);
    })
    this.bindChangeListners();
  }

  ngAfterViewInit(): void {
    this.adjustHeight();
  }

  ngOnInit(): void {
    this.optionFormArray = this.questionForm.get('options') as FormArray;
    this.isDisabled = this.questionForm.disabled
  }

  bindChangeListners() {
    this.qf.question.valueChanges.subscribe(() => {
      this.adjustHeight()
      this.invalidQuestion();
    })
    this.getRange(4).forEach((val, ind) => {
      this.qf.options.at(ind).valueChanges.subscribe(() => {
        this.invalidOptions(ind);
      })
    })
    this.qf.point.valueChanges.subscribe(() => {
      this.invalidQuestionPoint();
    })
  }

  private adjustHeight(): void {
    const inputElement = this.questionField.nativeElement;
    inputElement.style.height = 'auto'; // Reset height to auto
    inputElement.style.height = `${inputElement.scrollHeight}px`; // Set height to the scrollHeight
  }

  questionMediaReceived(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files[0]) {
      const file = inputElement.files[0];

      if (!file.type.startsWith('image/')) {
        console.error('Selected file is not an image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.question_media_preview = reader.result as string;
        this.qf.questionImage.setValue(this.question_media_preview);
      };

      reader.readAsDataURL(file);
    }
  }

  removeQuestionMedia() {
    this.question_media_preview = null;
    this.qf.questionImage.setValue(null);
  }

  convertIndexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  markAsCorrectOption(index: number) {
    let current = this.qf.options.at(index).controls.isCorrect.value;
    for (const option of this.qf.options.controls) {
      option.controls.isCorrect.setValue(false);
    }
    this.qf.options.at(index).controls.isCorrect.setValue(!current);
  }

  get qf() {
    return this.questionForm.controls;
  }

  invalidQuestion() {
    const question = this.qf.question;
    const hasError = question.touched && question.dirty && question.invalid || this.isFormSubmitted && question.invalid || this.highLightError;
    if (hasError) {
      if (question.hasError('minlength')) {
        this.questionErrorMessage = "Question is too short"
      }
      else if (question.hasError('maxlength')) {
        this.questionErrorMessage = "Question is too long"
      }
      else if (question.hasError('required')) {
        this.questionErrorMessage = "Question is required"
      }
    }
    else {
      this.questionErrorMessage = null
    }
    return hasError;
  }

  invalidOptions(index: number) {
    const option = this.qf.options.at(index).controls.option;
    const hasError = option.touched && option.dirty && option.invalid || this.isFormSubmitted && option.invalid || this.highLightError;

    if (hasError) {
      if (option.hasError('maxlength')) {
        this.optionsErrorMessage[index] = "Option is too long"
      }
      else if (option.hasError('required')) {
        this.optionsErrorMessage[index] = "Option is required"
      }
    }
    else {
      this.optionsErrorMessage[index] = null
    }
    return hasError;
  }

  invalidQuestionPoint() {
    const point = this.qf.point;
    const hasError = point.dirty && point.invalid || this.isFormSubmitted && point.invalid || this.highLightError;

    if (hasError) {
      if (point.hasError('maxlength')) {
        this.pointErrorMessage = "Point should be 10 or less"
      }
      else if (point.hasError('minlength')) {
        this.pointErrorMessage = "Point should be 1 or more"
      }
      else if (point.hasError('required')) {
        this.pointErrorMessage = "Point is required"
      }
    }
    else {
      this.pointErrorMessage = null
    }
    return hasError;
  }

  clearQuestion() {
    this.questionForm.reset();
    this.questionForm.markAsPristine()
  }

  deleteQuestion() {
    this.deleteChild.emit(this.$index)
  }

  getRange(index: number) {
    return new Array(index).fill(1);
  }

  incrementPoint() {
    let currentPoint = this.qf.point.value;
    if (currentPoint < 10)
      this.qf.point.setValue(this.qf.point.value + 1)
  }

  decrementPoint() {
    let currentPoint = this.qf.point.value;
    if (currentPoint > 1)
      this.qf.point.setValue(this.qf.point.value - 1)
  }
}
