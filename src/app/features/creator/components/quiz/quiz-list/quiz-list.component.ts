import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuizTemplateComponent } from './quiz-template/quiz-template.component';
import { ReactiveFormsModule } from '@angular/forms';
import { map, Subject, takeUntil } from 'rxjs';
import { CategoryBoxComponent } from '../../../../category/components/category-box/category-box.component';
import { ListHeaderComponent } from './list-header/creator-list-header.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { QuizService } from '../../../../../core/services/quiz.service';
import { CategoryService } from '../../../../category/_services/category.service';
import { User } from '../../../../../core/models/User.model';
import { quiz } from '../../../../../core/models/quiz.model';
import { category } from '../../../../../core/models/category.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CategoryBoxComponent,
    QuizTemplateComponent,
    ListHeaderComponent,
    PaginationComponent,
  ],
  templateUrl: './quiz-list.component.html',
  styleUrl: './quiz-list.component.css',
})
export class creatorQuizListComponent {
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();
  private quizService = inject(QuizService);
  private categoryService = inject(CategoryService);
  private router = inject(ActivatedRoute);

  user: User | null | undefined = null;
  quizzes: quiz[] = [];
  categories: category[] = [];
  loaded = false;
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
    this.router.queryParams.subscribe((params) => {
      let difficulty = params['difficulty'];
      let status = params['status'];
      let category = params['category'];
      this.currentFilter.difficulty = difficulty;
      this.currentFilter.status = status;
      this.currentFilter.categoryId = category;
      this.fetchQuizSet();
    });
  }

  fetchQuizSet() {
    const fields = '_id title difficulty meta { acceptanceRate } quizStatus';
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
    const quizFields =
      '_id title difficulty meta { acceptanceRate } quizStatus';
    this.currentFilter.page = page;
    this.quizService
      .getAllQuizzes(quizFields, this.currentFilter)
      .subscribe((quizzes) => {
        if (quizzes) {
          this.loaded = true;
          this.quizzes = quizzes;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
