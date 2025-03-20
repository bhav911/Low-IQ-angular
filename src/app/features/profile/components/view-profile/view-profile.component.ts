import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuizTemplateComponent } from './quiz-template/quiz-template.component';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../core/models/User.model';
import { Achievement } from '../../../../core/models/achievement.model';
import { creatorStats, playerStats } from '../../../../core/models/stat.model';
import { LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts';
import { Profile } from '../../../../core/models/Profile.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { QuizService } from '../../../../core/services/quiz.service';
import { ResultService } from '../../../result/_services/result.service';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    QuizTemplateComponent,
    NgxChartsModule,
    PaginationComponent,
  ],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css',
})
export class ViewProfileComponent implements OnInit {
  private accountService = inject(AccountService);
  private quizService = inject(QuizService);
  private resultService = inject(ResultService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // private achievementService = inject(AchievementService);
  private renderer = inject(Renderer2);

  screenWidth!: number;
  resizeObserver!: ResizeObserver;
  private destroy$ = new Subject<void>();

  username = '';
  loaded = false;
  user: User | null = null;
  profileUser!: Profile;
  achievements: Achievement[] = [];
  achievementsToDisplay: Achievement[] = [];
  activeAchievement: Achievement | null = null;

  quizStats: any = null;
  playerStats: playerStats = {
    quizzes: [],
    attempted: { easy: 0, hard: 0, medium: 0 },
    passed: { easy: 0, hard: 0, medium: 0 },
    previewed: { easy: 0, hard: 0, medium: 0 },
  };
  creatorStats: creatorStats = {
    accepted: { easy: 0, hard: 0, medium: 0 },
    rejected: { easy: 0, hard: 0, medium: 0 },
    pending: { easy: 0, hard: 0, medium: 0 },
  };
  accumulatedCreatorStat = {
    accepted: 0,
    rejected: 0,
    pending: 0,
  };
  accumulatedPlayerStat = {
    attempted: 0,
    passed: 0,
    previewed: 0,
  };
  showChart = false;
  showAllAchievementBox = false;
  rank: number = 0;
  QUIZZES_PER_PAGE = 15;
  pageCount = 0;
  currentFilter: any = {
    page: 1,
  };

  showLabels: boolean = false;
  legendPosition = LegendPosition.Right;
  acceptanceRate = 0;
  chartDifficultyType = 'Overall';

  // Define data for the chart
  data = [
    { name: 'Passed', value: 0 },
    { name: 'Failed', value: 0 },
    { name: 'Previewed', value: 0 },
  ];

  customColors = [
    { name: 'Passed', value: '#3AA26E' },
    { name: 'Failed', value: '#D61A3C' },
    { name: 'Previewed', value: '#FFD700' },
  ];

  userNotFound = false;
  quizStatus = 0;

  ngOnInit(): void {
    this.route.params.subscribe((param) => {
      this.username = param['username'];
      this.fetchUser();
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateScreenWidth();
    });

    // Observe the body or any element you wish to track
    this.resizeObserver.observe(document.body);

    // Initialize screen size
    this.updateScreenWidth();
  }

  @HostListener('click', ['$event'])
  showAcceptanceRatio($event: MouseEvent) {
    let element = $event.target as HTMLElement;
    if (element.closest('.progress-difficuty')) {
      let level = element.closest('.progress-difficuty')!.getAttribute('level');
      this.chartDifficultyType = level!;
      if (this.profileUser?.user.role === 'player')
        this.difficultyWiseUserPassedFailed(level!);
      else if (this.profileUser.user.userId == this.user?.userId)
        this.difficultyWiseCreatorStat(level!);
    } else if (element.closest('.progress-attempted')) {
      if (this.profileUser?.user.role === 'player') {
        this.totalPassedFailed(this.playerStats);
      } else if (this.profileUser.user.userId === this.user?.userId) {
        this.creatorStatTotalComputation(this.creatorStats);
      }
      this.chartDifficultyType = 'Overall';
    }

    if (this.activeAchievement && this.showAllAchievementBox) {
      this.toggleAchievement();
    } else if (this.activeAchievement) {
      this.toggleAchievement();
    } else if (this.showAllAchievementBox) {
      this.toggleAllAchievementBox();
    }
  }

  updateScreenWidth() {
    this.screenWidth = window.innerWidth;

    if (this.screenWidth > 1210) {
      this.showLabels = false;
      this.achievementsToDisplay = this.achievements.slice(0, 4);
    } else if (this.screenWidth <= 1210 && this.screenWidth > 996) {
      this.showLabels = true;
      this.achievementsToDisplay = this.achievementsToDisplay.slice(0, 3);
    } else if (this.screenWidth <= 996 && this.screenWidth > 860) {
      this.showLabels = true;
      this.achievementsToDisplay = this.achievementsToDisplay.slice(0, 2);
    } else if (this.screenWidth <= 860 && this.screenWidth > 780) {
      this.showLabels = false;
      this.achievementsToDisplay = this.achievements;
    } else if (this.screenWidth <= 780) {
      this.showLabels = true;
      this.achievementsToDisplay = this.achievements;
    }
  }

  fetchUser() {
    this.authService.$user
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe((user) => {
        if (user) {
          this.user = user;
        }
      });
    this.fetchUserData();
  }

  fetchUserData() {
    this.accountService.fetchProfile(this.username).subscribe((next) => {
      if (next.playerStats) {
        this.playerStats = next.playerStats;
      }
      if (next.creatorStats) {
        this.creatorStats = next.creatorStats;
      }
      this.quizStats = next.quizStats;
      if (next === null) {
        this.loaded = true;
        this.userNotFound = true;
        return;
      }
      this.profileUser = next;
      this.profileUser.user.userId = next.user._id;
      if (this.profileUser.user.role === 'creator') {
        this.customColors = [
          { name: 'Accepted', value: '#3AA26E' },
          { name: 'Rejected', value: '#D61A3C' },
          { name: 'Pending', value: '#FFD700' },
        ];
        this.creatorStatTotalComputation(this.creatorStats);
        this.pageCount = Math.ceil(this.totalPublished / this.QUIZZES_PER_PAGE);
      } else {
        this.totalPassedFailed(this.playerStats);
        this.pageCount = Math.ceil(this.totalAttempted / this.QUIZZES_PER_PAGE);
      }
      this.loaded = true;
      if (this.profileUser.user.role === 'player') {
        let achs = this.profileUser.user.achievements;
        this.achievements =
          this.user?.userId !== this.profileUser.user.userId
            ? achs.filter((ach) => ach.isUnlocked)
            : achs;
        this.achievementsToDisplay = this.achievements.slice(0, 4);
      }
    });
  }

  creatorStatTotalComputation(creatorStat: any) {
    const status = ['accepted', 'pending', 'rejected'] as const;
    status.forEach((ele: (typeof status)[number]) => {
      this.accumulatedCreatorStat![ele] = ['easy', 'medium', 'hard'].reduce(
        (prev, level) => {
          return prev + (creatorStat[ele][level] ?? 0);
        },
        0
      );
    });

    this.data = [
      { name: 'Accepted', value: this.accumulatedCreatorStat.accepted },
      { name: 'Pending', value: this.accumulatedCreatorStat.pending },
      { name: 'Rejected', value: this.accumulatedCreatorStat.rejected },
    ];

    this.showChart = !(
      this.accumulatedCreatorStat.accepted == 0 &&
      this.accumulatedCreatorStat.pending == 0 &&
      this.accumulatedCreatorStat.rejected == 0
    );
  }

  totalPassedFailed(playerStat: any) {
    const status = ['attempted', 'passed', 'previewed'] as const;
    status.forEach((ele: (typeof status)[number]) => {
      this.accumulatedPlayerStat![ele] = ['easy', 'medium', 'hard'].reduce(
        (prev, level) => {
          return prev + (playerStat[ele][level] ?? 0);
        },
        0
      );
    });

    this.data = [
      { name: 'Passed', value: this.accumulatedPlayerStat.passed },
      {
        name: 'Failed',
        value:
          this.accumulatedPlayerStat.attempted -
          this.accumulatedPlayerStat.passed,
      },
      { name: 'Previewed', value: this.accumulatedPlayerStat.previewed },
    ];
    this.acceptanceRate = +(
      (this.accumulatedPlayerStat.passed /
        this.accumulatedPlayerStat.attempted) *
      100
    ).toFixed(2);
    if (Number.isNaN(this.acceptanceRate)) {
      this.acceptanceRate = -1;
    }
    this.showChart = !(
      this.accumulatedPlayerStat.attempted == 0 &&
      this.accumulatedPlayerStat.previewed == 0
    );
  }

  fetchQuizzes(page: number) {
    this.currentFilter.page = page;
    if (this.profileUser.user.role === 'creator') {
      this.currentFilter.creatorId = this.profileUser.user.userId;
    }
    const serviceCall =
      this.profileUser.user?.role === 'creator'
        ? this.quizService.getCreatorQuizzes(this.currentFilter)
        : this.resultService.getSubmissions(this.profileUser.user.userId, page);

    serviceCall.subscribe((quizzes: any) => {
      if (quizzes) {
        this.profileUser.quizzes = quizzes;
      }
    });
  }

  difficultyWiseUserPassedFailed(level: string) {
    let passed =
      this.playerStats?.passed?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    let attempted =
      this.playerStats?.attempted?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    let previewed =
      this.playerStats?.previewed?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    let failed = attempted - passed;
    this.data = [
      { name: 'Passed', value: passed },
      { name: 'Failed', value: failed },
      { name: 'Previewed', value: previewed },
    ];
    this.acceptanceRate = +((passed / attempted) * 100).toFixed(2);
    if (Number.isNaN(this.acceptanceRate)) {
      this.acceptanceRate = -1;
    }
    this.showChart = !(attempted == 0 && previewed == 0);
  }

  difficultyWiseCreatorStat(level: string) {
    let accepted =
      this.creatorStats?.accepted?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    let rejected =
      this.creatorStats?.rejected?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    let pendingPublish =
      this.creatorStats?.pending?.[level as 'easy' | 'medium' | 'hard'] ?? 0;
    this.data = [
      { name: 'Accepted', value: accepted },
      { name: 'Rejected', value: rejected },
      { name: 'Pending', value: pendingPublish },
    ];
    this.showChart = !(accepted == 0 && rejected == 0 && pendingPublish == 0);
  }

  getProgressBoxClass() {
    return {
      'justify-content-center':
        this.profileUser?.user.role == 'creator' &&
        this.profileUser.user.userId !== this.user?.userId,
      'justify-content-between':
        this.profileUser?.user.role === 'player' ||
        this.profileUser.user.userId === this.user?.userId,
    };
  }

  toggleAchievement(achievementId?: string) {
    if (!achievementId) {
      this.activeAchievement = null;
      if (!this.showAllAchievementBox) {
        this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
      }
      return;
    }
    this.renderer.addClass(document.body, 'no-scroll'); // Disable scrolling
    this.activeAchievement =
      this.achievements.find((ach) => ach._id === achievementId) ?? null;
  }

  toggleAllAchievementBox() {
    if (this.showAllAchievementBox) {
      this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
    } else {
      this.renderer.addClass(document.body, 'no-scroll'); // Disable scrolling
    }
    this.showAllAchievementBox = !this.showAllAchievementBox;
  }

  changeQuizStatus(statusCode: number) {
    this.quizStatus = statusCode;
    // 0: all // 1: published // 2: unpublished // 3: rejected
    // switch (statusCode) {
    //   case 0: {
    //     this.easyCount = (this.publishedQuizzes?.easy ?? 0) + (this.pendingPublishedQuizzes?.easy ?? 0)
    //     this.mediumCount = (this.publishedQuizzes?.medium ?? 0) + (this.pendingPublishedQuizzes?.medium ?? 0)
    //     this.hardCount = (this.publishedQuizzes?.hard ?? 0) + (this.pendingPublishedQuizzes?.hard ?? 0)
    //     this.totalCount = this.easyCount + this.mediumCount + this.hardCount
    //     break;
    //   }
    //   case 1: {
    //     this.easyCount = this.publishedQuizzes?.easy ?? 0
    //     this.mediumCount = this.publishedQuizzes?.medium ?? 0
    //     this.hardCount = this.publishedQuizzes?.hard ?? 0
    //     this.totalCount = this.easyCount + this.mediumCount + this.hardCount
    //     break;
    //   }
    //   case 2: {
    //     this.easyCount = this.pendingPublishedQuizzes?.easy ?? 0
    //     this.mediumCount = this.pendingPublishedQuizzes?.medium ?? 0
    //     this.hardCount = this.pendingPublishedQuizzes?.hard ?? 0
    //     this.totalCount = this.easyCount + this.mediumCount + this.hardCount
    //     break;
    //   }
    // }
  }

  get totalPublished() {
    let total = 0;
    const meta = ['easy', 'medium', 'hard'] as const;
    meta.forEach((dif: (typeof meta)[number]) => {
      total += this.creatorStats!.accepted![dif];
    });
    if (this.user && this.user.userId === this.profileUser.user.userId) {
      meta.forEach((dif: (typeof meta)[number]) => {
        total +=
          this.creatorStats!.rejected![dif] + this.creatorStats!.pending![dif];
      });
    }

    return total;
  }

  get totalEasyCreated() {
    let total = 0;
    total += this.creatorStats!.accepted!['easy'];
    if (this.user && this.user.userId === this.profileUser.user.userId) {
      total +=
        this.creatorStats!.rejected!['easy'] +
        this.creatorStats!.pending!['easy'];
    }
    return total;
  }

  get totalMediumCreated() {
    let total = 0;
    total += this.creatorStats!.accepted!['medium'];
    if (this.user && this.user.userId === this.profileUser.user.userId) {
      total +=
        this.creatorStats!.rejected!['medium'] +
        this.creatorStats!.pending!['medium'];
    }
    return total;
  }

  get totalHardCreated() {
    let total = 0;
    total += this.creatorStats!.accepted!['hard'];
    if (this.user && this.user.userId === this.profileUser.user.userId) {
      total +=
        this.creatorStats!.rejected!['hard'] +
        this.creatorStats!.pending!['hard'];
    }
    return total;
  }

  get totalAttempted() {
    let total = 0;
    const meta = ['easy', 'medium', 'hard'] as const;
    meta.forEach((dif: (typeof meta)[number]) => {
      total +=
        this.playerStats!.attempted![dif] + this.playerStats!.previewed![dif];
    });
    return total;
  }

  get totalEasyAttempted() {
    let total = 0;
    total +=
      this.playerStats!.attempted!['easy'] +
      this.playerStats!.previewed!['easy'];
    return total;
  }

  get totalMediumAttempted() {
    let total = 0;
    total +=
      this.playerStats!.attempted!['medium'] +
      this.playerStats!.previewed!['medium'];
    return total;
  }

  get totalHardAttempted() {
    let total = 0;
    total +=
      this.playerStats!.attempted!['hard'] +
      this.playerStats!.previewed!['hard'];
    return total;
  }

  redirectUser() {
    return this.router.navigate([
      this.user?.role === 'player' ? '/quizset' : 'creator/quiz/create-quiz',
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
