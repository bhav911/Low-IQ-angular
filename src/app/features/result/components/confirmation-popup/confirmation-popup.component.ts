import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../../../core/services/quiz.service';
import { Location } from '@angular/common';
import { ResultService } from '../../_services/result.service';

@Component({
  selector: 'app-confirmation-popup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmation-popup.component.html',
  styleUrl: './confirmation-popup.component.css',
})
export class ConfirmationPopupComponent implements OnInit {
  private router = inject(Router);
  private quizService = inject(QuizService);
  private resultService = inject(ResultService);
  private location = inject(Location);

  @Output() proceed = new EventEmitter<boolean>();
  resultId = input.required<string>();
  quizId = '';
  load = true;

  ngOnInit(): void {
    this.quizId = history.state['quizId'];
  }

  goBack() {
    if (window.history.length > 2) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  proceedToResult() {
    this.resultService.markQuizResultSeen(this.quizId).subscribe({
      next: (Success) => {
        return this.router.navigate(['/result', this.resultId()], {
          queryParams: {
            green: true,
          },
        });
      },
    });
  }
}
