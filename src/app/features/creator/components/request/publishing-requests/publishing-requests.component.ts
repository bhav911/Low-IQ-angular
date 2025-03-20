import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestTemplateComponent } from './request-template/request-template.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { PublishingRequestsService } from '../../../_service/publishing-requests.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../../core/models/User.model';
import { Request } from '../../../../../core/models/request.model';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-publishing-requests',
  standalone: true,
  imports: [
    CommonModule,
    RequestTemplateComponent,
    RouterLink,
    LoadingSpinnerComponent,
  ],
  templateUrl: './publishing-requests.component.html',
  styleUrl: './publishing-requests.component.css',
})
export class PublishingRequestsComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private publishingRequestsService = inject(PublishingRequestsService);

  private destroy$ = new Subject<void>();
  user: User | null | undefined = null;
  requestList: Request[] = [];
  private page = 1;
  private REQUEST_PER_BATCH = 20;
  private hasMoreRequest = false;
  isFetching = false;
  loaded = false;

  @ViewChild('scrollTracker', { static: false }) scrollTracker!: ElementRef;

  ngOnInit(): void {
    this.authService.userValue
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
        this.fetchRequests();
      });
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (this.hasMoreRequest && !this.isFetching) {
          this.fetchRequests();
        }
      }
    });

    observer.observe(this.scrollTracker.nativeElement);
  }

  fetchRequests() {
    this.isFetching = true;
    setTimeout(() => {
      this.publishingRequestsService.fetchRequests(this.page).subscribe({
        next: (requestList) => {
          this.isFetching = false;
          this.page++;
          this.requestList.push(...requestList);
          this.hasMoreRequest = requestList.length === this.REQUEST_PER_BATCH;
        },
      });
    }, 1500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
