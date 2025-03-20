import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TemplateComponent } from "./template/template.component";
import { CategoryService } from '../../_services/category.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { quiz } from '../../../../core/models/quiz.model';
import { playerStats } from '../../../../core/models/stat.model';
import { category } from '../../../../core/models/category.model';
import { User } from '../../../../core/models/User.model';
import { QuizService } from '../../../../core/services/quiz.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink, CommonModule, TemplateComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit {
  categoryId = input.required<string>();
  loaded = false;
  private categoryService = inject(CategoryService);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  firstNotAttemptedQuiz: quiz | undefined = undefined;
  quizzes = signal<quiz[]>([]);
  stats = signal<playerStats | null>(null);
  category = signal<category | null>(null);
  user: User | null | undefined = null;
  attemptedList: Record<string, boolean> = {};
  QUIZ_PER_PAGE = 15;
  page = 1;
  hasMoreQuiz = false;
  disabledEasy = 0
  disabledMedium = 0
  disabledHard = 0
  totalCount = 0
  easyCount = 0
  mediumCount = 0
  hardCount = 0
  quizStatus = 0;

  ngOnInit(): void {
    this.authService.userValue
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe(user => {
        this.user = user
        this.categoryService.fetchCategory(this.categoryId()).subscribe({
          next: category => {
            this.loaded = true;
            this.category.set(category);
            this.quizzes.set(category.quizzes);
            this.hasMoreQuiz = category.quizzes.length === this.QUIZ_PER_PAGE
            this.page++;


            this.playerPreComputation();
            if (user?.role === 'creator') {
              this.creatorPreComputation();
            }
          }
        })
      })
  }

  playerPreComputation() {
    let found = false;
    if (this.user === null) {
      this.firstNotAttemptedQuiz = this.quizzes().at(0);
    }
    else {
      this.quizzes().forEach(quiz => {
        if (found) return;
        if (!quiz.isAttempted) {
          found = true
          this.firstNotAttemptedQuiz = quiz;
        }
      })
    }
  }

  creatorPreComputation() {
    this.changeQuizStatus(0);
  }

  fetchQuizzes() {
    if (!this.hasMoreQuiz) {
      return;
    }
    const fields = "_id title difficulty isAttempted quizStatus"
    const filters = {
      page: this.page,
      categoryId: this.categoryId()
    }
    this.quizService.getAllQuizzes(fields, filters).subscribe({
      next: quizzes => {
        const allQuiz = [...this.quizzes()]
        allQuiz.push(...quizzes)
        this.quizzes.set(allQuiz);
        this.hasMoreQuiz = quizzes.length === this.QUIZ_PER_PAGE
        this.page++;
      }
    })
  }

  changeQuizStatus(statusCode: number) {
    this.quizStatus = statusCode;
    // 0: all // 1: published // 2: unpublished // 3: rejected
    switch (statusCode) {
      case 0: {
        this.easyCount = (this.publishedQuizzes?.easy ?? 0) + (this.pendingPublishedQuizzes?.easy ?? 0)
        this.mediumCount = (this.publishedQuizzes?.medium ?? 0) + (this.pendingPublishedQuizzes?.medium ?? 0)
        this.hardCount = (this.publishedQuizzes?.hard ?? 0) + (this.pendingPublishedQuizzes?.hard ?? 0)
        this.totalCount = this.easyCount + this.mediumCount + this.hardCount
        break;
      }
      case 1: {
        this.easyCount = this.publishedQuizzes?.easy ?? 0
        this.mediumCount = this.publishedQuizzes?.medium ?? 0
        this.hardCount = this.publishedQuizzes?.hard ?? 0
        this.totalCount = this.easyCount + this.mediumCount + this.hardCount
        break;
      }
      case 2: {
        this.easyCount = this.pendingPublishedQuizzes?.easy ?? 0
        this.mediumCount = this.pendingPublishedQuizzes?.medium ?? 0
        this.hardCount = this.pendingPublishedQuizzes?.hard ?? 0
        this.totalCount = this.easyCount + this.mediumCount + this.hardCount
        break;
      }
      case 3: {
        this.easyCount = this.rejectedQuizzes?.easy ?? 0
        this.mediumCount = this.rejectedQuizzes?.medium ?? 0
        this.hardCount = this.rejectedQuizzes?.hard ?? 0
        this.totalCount = this.easyCount + this.mediumCount + this.hardCount
        break;
      }
    }
  }

  get meta() {
    return this.category()!.meta;
  }

  get publishedQuizzes() {
    return this.category()!.creatorStats!.accepted;
  }

  get pendingPublishedQuizzes() {
    return this.category()!.creatorStats!.pending;
  }

  get rejectedQuizzes() {
    return this.category()!.creatorStats!.rejected;
  }

  get attempted() {
    return this.category()?.playerStats?.attempted;
  }

  get metaStat() {
    let meta = this.meta;
    if (!meta) {
      return 0;
    }
    return meta.easy + meta.hard + meta.medium
  }

  get totalAttempted() {
    let attempted = this.category()?.playerStats?.attempted;
    return (
      (attempted?.easy ?? 0) + (attempted?.medium ?? 0) + (attempted?.hard ?? 0)
    )
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
