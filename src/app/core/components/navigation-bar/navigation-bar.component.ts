import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../models/User.model';
import { Notification } from '../../models/notification.model';
import { CommonModule } from '@angular/common';
import { NotificationTemplateComponent } from './notification-template/notification-template.component';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationTemplateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './navigation-bar.component.html',
  styleUrl: './navigation-bar.component.css',
})
export class NavigationBarComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  user: User | null | undefined = null;
  profilePanelOpen = false;
  notificationPanelOpen = false;
  sidebarOpen = false;
  notifications: Notification[] = [];
  hasNewNotifications = false;
  hasMoreNotifications = false;
  fetchingNotifications = false;
  wrapPanels = input<boolean>(false);
  showAllProfiles = false;
  allowAddingAnotherProfile = false;
  anotherUser: User | null = null;
  notificationPage = 2;
  NOTIFICATION_PER_PAGE = 10;

  @ViewChild('scrollAnchor', { static: true }) scrollAnchor!: ElementRef;

  constructor() {
    effect(() => {
      if (this.wrapPanels()) {
        this.profilePanelOpen = false;
        this.notificationPanelOpen = false;
        this.sidebarOpen = false;
        this.showAllProfiles = false;
      }
    });
  }

  ngOnInit(): void {
    this.renderer.removeClass(document.body, 'no-scroll');
    const s1 = this.authService.$user.subscribe((user) => {
      this.user = user;
      this.notifications = user?.notifications || [];
      this.hasMoreNotifications =
        this.notifications.length == this.NOTIFICATION_PER_PAGE;
      if (user) {
        this.fetchOtherProfiles();
      } else {
        this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
      }
    });
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreNotifications();
      }
    });

    observer.observe(this.scrollAnchor.nativeElement);
  }

  fetchOtherProfiles() {
    let token = localStorage.getItem(
      'token-' + (this.user?.role === 'creator' ? 'player' : 'creator')
    );
    if (token) {
      this.authService.validateToken(token).subscribe({
        next: (user) => {
          this.anotherUser = user;
          this.allowAddingAnotherProfile = true;
        },
      });
    } else {
      this.anotherUser = null;
    }
    if (!token && this.user?.role === 'creator') {
      this.allowAddingAnotherProfile = true;
    } else {
      this.allowAddingAnotherProfile = false;
    }
  }

  switchProfile() {
    this.authService.switchProfile().subscribe((status) => {
      this.sidebarOpen = false;
      this.notificationPanelOpen = false;
      this.profilePanelOpen = false;
      this.showAllProfiles = false;
      if (status) {
        return this.router.navigateByUrl('/home', {
          replaceUrl: true,
        });
      }
      return;
    });
  }

  checkForNewNotifications() {
    this.hasNewNotifications = this.notifications.find(
      (notif) => notif.hasSeen === false
    )
      ? true
      : false;
  }

  loadMoreNotifications() {
    if (!this.hasMoreNotifications || this.fetchingNotifications) {
      return;
    }
    this.fetchingNotifications = true;
    this.notificationService
      .fetchNotifications(this.notificationPage)
      .subscribe({
        next: (notifications) => {
          const updatedNotifications = [
            ...this.notifications,
            ...notifications,
          ];
          this.notifications = updatedNotifications;
          this.hasMoreNotifications =
            notifications.length == this.NOTIFICATION_PER_PAGE;
          this.notificationPage++;
          this.fetchingNotifications = false;
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  redirectUser(link: string) {
    this.sidebarOpen = false;
    this.profilePanelOpen = false;
    this.notificationPanelOpen = false;

    if (this.user?.role === 'creator' && link === 'quizset') {
      this.router.navigate(['/creator/quiz', link]);
    } else {
      this.router.navigate([link]);
    }
    this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
  }

  logoutUser() {
    this.authService.logout();
  }

  toggleProfilePanel() {
    this.profilePanelOpen = !this.profilePanelOpen;
    this.notificationPanelOpen = false;
  }

  toggleNotificationPanel() {
    this.profilePanelOpen = false;
    this.notificationPanelOpen = !this.notificationPanelOpen;
    if (this.notificationPanelOpen) {
      this.renderer.addClass(document.body, 'no-scroll'); // Disable scrolling
    } else {
      this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
    }
  }

  toggleProfiles() {
    this.showAllProfiles = !this.showAllProfiles;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) {
      this.renderer.addClass(document.body, 'no-scroll'); // Disable scrolling
    } else {
      this.renderer.removeClass(document.body, 'no-scroll'); // Disable scrolling
    }
  }

  redirectCreatorForAddingProfile() {
    this.profilePanelOpen = false;
    this.notificationPanelOpen = false;
    this.sidebarOpen = false;
    this.showAllProfiles = false;
    this.router.navigate(['/signup'], {
      state: {
        allowLogin: true,
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
