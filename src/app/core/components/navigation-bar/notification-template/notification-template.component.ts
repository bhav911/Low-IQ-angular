import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Notification } from '../../../models/notification.model';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-template.component.html',
  styleUrl: './notification-template.component.css',
})
export class NotificationTemplateComponent implements OnInit {
  private renderer = inject(Renderer2);
  private router = inject(Router);

  private notificationService = inject(NotificationService);

  notification = input.required<Notification>();
  @Output() clicked = new EventEmitter();
  createdAt = '';

  ngOnInit(): void {
    const date = new Date(+this.notification().createdAt);
    this.createdAt = date.toLocaleDateString();
  }

  notificationClicked() {
    this.notificationService
      .markNotificationAsSeen(this.notification()._id)
      .subscribe();
    this.clicked.emit('clicked');
    this.router.navigate([this.notification().navigationRoute]);
    this.notification().hasSeen = true;
  }
}
