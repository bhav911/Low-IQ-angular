import {
  Component,
  effect,
  HostListener,
  inject,
  Input,
  OnInit,
  Renderer2,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommentBoxComponent } from './comment-box/comment-box.component';
import { quiz } from '../../../../core/models/quiz.model';
import { AuthService } from '../../../../core/services/auth.service';
import { filter, Subject, takeUntil } from 'rxjs';
import { User } from '../../../../core/models/User.model';
import { QuizService } from '../../../../core/services/quiz.service';
import { UserReviewService } from '../../_services/user-review.service';
import { Comment } from '../../../../core/models/comment.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-quiz-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CommentBoxComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './quiz-details.component.html',
  styleUrl: './quiz-details.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class QuizDetailsComponent implements OnInit {
  @Input() quizId!: string;
  @Input() requestId!: string;
  quiz: quiz | null = null;
  loaded = signal(false);
  quizLiked: any;

  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private userReviewService = inject(UserReviewService);

  private destroy$ = new Subject<void>();

  private router = inject(Router);
  private renderer = inject(Renderer2);
  private route = inject(ActivatedRoute);

  user: User | null | undefined = undefined;
  resultId: string = '';
  discussForm: FormGroup;
  hasMoreComments = true;
  showSortingOption = false;
  fetchingComments = false;
  activeSort = {
    '1': false, //oldest
    '-1': true, //newest
  };
  COMMENTS_PER_BATCH = 10;
  sortOrder = -1;
  commentPage = 2;
  scrollAnchor: any;

  observeScroll() {
    if (this.scrollAnchor) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.fetchingComments) {
          if (this.hasMoreComments) {
            this.fetchingComments = true;
            setTimeout(() => {
              this.fetchComments(this.sortOrder);
            }, 2000);
          }
        }
      });
      observer.observe(this.scrollAnchor);
    }
  }

  @HostListener('click', ['$event'])
  onClick($event: MouseEvent) {
    let element = $event.target as HTMLElement;
    if (!element.closest('.sortOptions')) {
      this.showSortingOption = false;
    }
  }

  constructor() {
    this.discussForm = new FormGroup({
      comment: new FormControl(),
    });

    effect(() => {
      if (this.loaded()) {
        this.observeScroll();
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((param) => {
      this.quizId = param['quizId'];
    });

    this.authService.$user
      .pipe(
        filter((u) => u !== undefined),
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe((user) => {
        this.user = user;
        this.getQuizData();
      });
  }

  getQuizData() {
    const fields =
      '_id title description difficulty questionCount reaction totalPoints quizStatus meta {   attempted   liked   passed } creatorId {   _id   username } categoryId {   _id   title } comments {   _id   reactionCount { liked } repliesCount   text   reaction createdAt userId { _id username profilePicture { link } }  } isAttempted resultId';
    this.quizService.getQuiz(this.quizId, fields).subscribe((quiz) => {
      if (quiz) {
        this.quiz = quiz;
        this.hasMoreComments = quiz.comments.length >= this.COMMENTS_PER_BATCH;
        this.loaded.set(true);
        setTimeout(() => {
          this.scrollAnchor = this.renderer.selectRootElement(
            '#scrollAnchor',
            true
          );
          this.observeScroll();
        }, 10);
      }
    });
  }

  redirectUser() {
    let url =
      (this.user?.role === 'admin' ? '/admin' : '/creator') +
      `/quiz/${this.quizId}/view`;
    let queryParam =
      this.user?.role === 'admin' ? { requestId: this.requestId } : {};
    this.router.navigate([url], {
      queryParams: queryParam,
    });
  }

  fetchComments(sortOrder: number) {
    if (!this.hasMoreComments && sortOrder === this.sortOrder) {
      return;
    }
    if (sortOrder !== this.sortOrder) {
      this.activeSort[1] = sortOrder === 1;
      this.activeSort[-1] = sortOrder === -1;
      this.commentPage = 1;
      this.quiz!.comments = [];
      this.sortOrder = sortOrder;
    }

    const existingIds = new Set(this.quiz!.comments?.map((r) => r._id));
    this.userReviewService
      .fetchComments(this.quizId!, this.commentPage, sortOrder)
      .subscribe({
        next: (comments) => {
          if (this.commentPage === 1) {
            this.quiz!.comments = comments;
          } else {
            //this step to remove duplicates created when commenting
            this.quiz?.comments!.push(
              ...comments.filter((r: any) => !existingIds.has(r._id))
            );
          }
          this.fetchingComments = false;
          this.commentPage++;
          this.hasMoreComments = comments.length == this.COMMENTS_PER_BATCH;
        },
      });
  }

  createComment() {
    let comment = this.discussForm.controls['comment'].value;
    this.userReviewService
      .createComment(comment, this.quizId)
      .subscribe((comment: Comment) => {
        this.quiz?.comments.unshift(comment);
        this.discussForm.controls['comment'].reset();
      });
  }

  get passingRate() {
    let meta = this.quiz?.meta!;
    if (meta.passed === 0) {
      if (meta.attempted === 0) return 'NA';
      return '0%';
    }
    return ((meta.passed / meta.attempted) * 100).toFixed(2) + '%';
  }

  updateQuizReaction(reaction: any) {
    let prevReaction = this.quiz!.reaction;
    this.quizService
      .updateQuizReaction(this.quizId, reaction)
      .subscribe((success) => {
        if (reaction === prevReaction) {
          reaction = null;
        }
        if (prevReaction !== null) this.quiz!.meta![prevReaction!]--;

        this.quiz!.reaction = reaction;
        if (reaction !== null) this.quiz!.meta![this.quiz!.reaction!]++;
      });
  }

  removeComment(commentId: string) {
    this.quiz!.comments = this.quiz!.comments.filter(
      (c) => c._id !== commentId
    );
  }

  // enDisableQuiz() {
  //   this.quizService.enableDisableQuiz(this.quizId, this.quiz?.categoryId!, this.quiz?.isEnabled!)
  //     .subscribe(next => {
  //       if (next) {
  //         this.quiz!.isEnabled = !this.quiz!.isEnabled;
  //       }
  //     })
  // }

  startQuiz() {
    if (this.quiz?.resultId) {
      return this.router.navigate(['result', this.quiz!.resultId]);
    } else {
      if (this.user) {
        return this.router.navigate(['quiz', this.quiz!._id, 'attempt']);
      } else {
        return this.router.navigate(['/signup'], {
          state: {
            redirectTo: `/quiz/${this.quiz?._id}/details`,
          },
        });
      }
    }
  }

  toggleSortingOptions() {
    this.showSortingOption = !this.showSortingOption;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
