import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../../../../core/services/auth.service";
import { PublishingRequestsService } from "../../../../_service/publishing-requests.service";
import { User } from "../../../../../../core/models/User.model";
import { Request, requestStatus } from "../../../../../../core/models/request.model";

@Component({
  selector: 'app-request-template',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-template.component.html',
  styleUrl: './request-template.component.css'
})
export class RequestTemplateComponent implements OnInit {

  private authService = inject(AuthService)
  // private feedbackService = inject(FeedbackService)
  private publishingRequestsService = inject(PublishingRequestsService)
  user: User | undefined | null = undefined
  request = input.required<Request>();
  fetchingFeedbacks = false;
  feedbacksFetched = false;
  ShowFeedbacks = false;
  createdAt = "";
  private page = 1;

  ngOnInit(): void {

    const date = new Date(+this.request().createdAt);
    this.createdAt = date.toLocaleDateString()
    this.authService.userValue
      .subscribe(user => {
        this.user = user
      })
  }

  toggleFeedbacksVisibility() {
    this.ShowFeedbacks = !this.ShowFeedbacks
    if (!this.feedbacksFetched && this.ShowFeedbacks) {
      this.fetchFeedbacks();
    }
  }

  fetchFeedbacks() {
    if (this.fetchingFeedbacks)
      return
    this.fetchingFeedbacks = true

    this.publishingRequestsService.fetchConversation(this.request()._id!, this.page)
      .subscribe({
        next: messages => {
          this.fetchingFeedbacks = false
          this.request().conversation = messages;
          this.request().hasSeen = true;
        },
        error: err => {
          this.fetchingFeedbacks = false
        },
        complete: () => {
          this.feedbacksFetched = true
        }
      })
  }

  getStatusClass() {
    let status = this.request().status
    return {
      'difficulty-easy': status === requestStatus.accepted,
      'difficulty-medium': status === requestStatus.pending,
      'difficulty-hard': status === requestStatus.rejected,
    }
  }

  getFeedbackStatusClass(messageId: string) {
    let status = this.request().conversation?.find(f => f._id === messageId)?.status
    return {
      'difficulty-easy': status === requestStatus.accepted,
      'difficulty-medium': status === requestStatus.pending,
      'difficulty-hard': status === requestStatus.rejected,
    }
  }
}
