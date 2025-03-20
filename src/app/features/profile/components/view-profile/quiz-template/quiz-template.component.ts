import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { quiz } from '../../../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-template.component.html',
  styleUrl: './quiz-template.component.css'
})
export class QuizTemplateComponent {

  private route = inject(Router);

  index = input.required<number>();
  role = input.required<string>();
  quiz = input.required<quiz>();


  redirectUser() {
    if (this.role() === 'player') {
      return this.route.navigate(['result', this.quiz()._id])
    }
    return this.route.navigate(['quiz', this.quiz()._id, 'details'])
  }
}
