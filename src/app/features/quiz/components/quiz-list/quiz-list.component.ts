import { Component, inject } from '@angular/core';
import { QuizTemplateComponent } from './quiz-template/quiz-template.component';
import { ListHeaderComponent } from '../list-header/list-header.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryBoxComponent } from '../../../category/components/category-box/category-box.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { category } from '../../../../core/models/category.model';
import { quiz } from '../../../../core/models/quiz.model';
import { User } from '../../../../core/models/User.model';
import { QuizService } from '../../../../core/services/quiz.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [
    QuizTemplateComponent,
    ListHeaderComponent,
    ReactiveFormsModule,
    CategoryBoxComponent,
    PaginationComponent,
  ],
  templateUrl: './quiz-list.component.html',
  styleUrl: './quiz-list.component.css',
})
export class QuizListComponent {
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  user: User | null | undefined = null;
  quizzes: quiz[] = [];
  categories: category[] = [];
  loaded = false;
  difficulty = 'all';
  category = 'all';
  QUIZZES_PER_PAGE = 15;
  pageCount = 0;
  currentFilter: any = {
    page: 1,
  };

  ngOnInit(): void {
    this.authService.userValue
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
      });
    this.route.queryParams.subscribe((params) => {
      let page = +params['page'];
      let difficulty = params['difficulty'];
      let category = params['category'];
      this.currentFilter.difficulty = difficulty;
      this.currentFilter.categoryId = category;
      if (page) {
        this.currentFilter.page = page;
      }
      this.fetchQuizSet();
    });
  }

  fetchQuizSet() {
    const fields = 'title difficulty _id isAttempted meta{ attempted passed }';
    this.quizService
      .getQuizSet(fields, this.currentFilter)
      .subscribe((quizset: any) => {
        this.loaded = true;
        this.quizzes = quizset.quizzes;
        this.categories = quizset.categories;
        let totalQuizzes = 0;
        ['easy', 'medium', 'hard'].forEach((dif) => {
          totalQuizzes += quizset.quizStats[dif];
        });
        this.pageCount = Math.ceil(totalQuizzes / this.QUIZZES_PER_PAGE);
      });
  }

  fetchQuizzes(page: number) {
    this.router.navigate([], {
      queryParams: {
        page,
      },
    });
    const fields = 'title difficulty _id isAttempted meta{ attempted passed }';
    this.currentFilter.page = page;
    this.quizService
      .getAllQuizzes(fields, this.currentFilter)
      .subscribe((quizzes) => {
        if (quizzes) {
          this.quizzes = quizzes;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
