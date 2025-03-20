import { Component, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { quiz } from '../../../../../core/models/quiz.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/User.model';

@Component({
  selector: 'list-template',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './template.component.html',
  styleUrl: './template.component.css'
})
export class TemplateComponent implements OnInit {

  private authService = inject(AuthService);
  user: User | null | undefined = null;

  quiz = input.required<quiz>();
  index = input.required<number>();

  ngOnInit(): void {
    this.authService.userValue
      .subscribe(user => {
        this.user = user
      }
      )
  }
}
