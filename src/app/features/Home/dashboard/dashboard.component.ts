import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../core/models/User.model';
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private authenticationService = inject(AuthService);
  private quizService = inject(QuizService);
  private router = inject(Router);

  user: User | null | undefined = undefined;
  loaded = false;

  ngOnInit(): void {
    this.authenticationService.userValue.subscribe((user) => {
      this.user = user;
      this.loaded = true;
    });
  }

  redirectUser() {
    this.router.navigate(['/signup'], {
      state: {
        role: 'creator',
        allowLogin: true,
      },
    });
  }
}
