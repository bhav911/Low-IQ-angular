import { inject, Injectable } from '@angular/core';
import { User } from '../models/User.model';
import { catchError, map, Subject, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);

  private authenticationService = inject(AuthService);
  private user: User | null | undefined = undefined;

  private destroy$ = new Subject<void>();

  constructor() {
    this.authenticationService.userValue.subscribe((user) => {
      if (user === null) {
        this.destroy$.next();
        this.destroy$.complete(); // Complete destroy$ to avoid multiple emissions
      }
      this.user = user;
    });
  }

  fetchNotifications(page: number) {
    return this.http
      .get<Notification[]>(
        environment.backendUrl + '/notification/fetchNofications',
        {
          params: {
            page: page,
          },
        }
      )
      .pipe(
        map((notifications) => {
          return notifications.map((notif) => {
            return {
              ...notif,
              createdAt: new Date(notif.createdAt).getTime().toString(),
            };
          });
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  markNotificationAsSeen(notificationId: string) {
    return this.http
      .post(environment.backendUrl + '/notification/markAsSeen', {
        notificationId,
      })
      .pipe(
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleError(error: any) {
    console.log(error);

    let message = error.error.errors[0].message;
    console.log(message);
    return throwError(() => {
      return { message };
    });
  }
}
