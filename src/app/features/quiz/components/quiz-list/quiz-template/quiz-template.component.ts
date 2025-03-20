import { Component, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { quizModel } from '../quizDetails.model';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-template.component.html',
  styleUrl: './quiz-template.component.css'
})
export class QuizTemplateComponent {

  private quizService = inject(QuizService);
  private route = inject(Router);
  private router = inject(ActivatedRoute);
  quizData = input<quizModel>();

  @Output() quizTriggered = new EventEmitter();

  deleteQuiz() {
    this.quizTriggered.emit();
    // this.quizService.deleteQuiz(this.quizData()?.quiz.quizId!, this.quiz?.isEnabled!)
    //   .then(() => {
    //     let params = this.router.snapshot.queryParams['difficulty']

    //     this.route.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
    //       this.route.navigate(['/quizset'], {
    //         queryParams: {
    //           difficulty: params ?? null
    //         }
    //       });
    //     });
    //   })
    //   .catch(errRes => {
    //     console.log(errRes);
    //   });
  }

  get quiz() {
    return this.quizData()?.quiz;
  }

  redirectUser() {
    this.quizTriggered.emit();
    if (this.quizData()!.role === 'teacher') {
      return this.route.navigate(['/admin', 'quiz', this.quizData()!.quiz._id, 'view'])
    }
    else {
      return this.route.navigate(['quiz', this.quizData()!.quiz._id, 'details'])
    }
  }

  get passingRate() {
    let meta = this.quiz?.meta!;
    if (meta.passed === 0) {
      if (meta.attempted === 0)
        return 'NA';
      return '0%';
    }
    return ((meta.passed / meta.attempted) * 100).toFixed(2) + '%';
  }
}
