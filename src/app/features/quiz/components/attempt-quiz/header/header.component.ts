import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit } from "@angular/core";
import { AuthService } from "../../../../../core/services/auth.service";
import { Subject, takeUntil } from "rxjs";
import { quiz } from "../../../../../core/models/quiz.model";
import { User } from "../../../../../core/models/User.model";
import { Router } from "@angular/router";


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  quizData = input.required<quiz>();
  user: User | undefined | null = undefined
  sideBarOpened = false;

  ngOnInit(): void {
    this.authService.userValue
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      ).
      subscribe(
        user => {
          this.user = user
        }
      )
  }

  redirectUser(route: string) {
    this.router.navigate([route], {
      replaceUrl: true
    })
  }

  openSidebar() {
    this.sideBarOpened = !this.sideBarOpened
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
