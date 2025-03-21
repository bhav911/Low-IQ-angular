import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import {
  catchError,
  filter,
  first,
  from,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { NewUser, RegisterUser } from '../models/newUser.model';
import { User } from '../models/User.model';
import { environment } from '../../../environment/environment';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private httpClient = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authenticationService = inject(AuthService);
  private user: User | null | undefined = undefined;

  constructor() {
    this.authenticationService.userValue.subscribe((user) => {
      this.user = user;
    });
  }

  updateUsername(username: string) {
    const graphQLquery = {
      query: `
        mutation Mutation($username: String!) {
          updateUsername(username: $username){
            Success
          }
        }
      `,
      variables: {
        username: username,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          if (data.updateUsername.success) {
            this.user!.username = username;
          }
          return data.updateUsername.success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  checkIfUsernameIsTaken(username: string) {
    const graphQLquery = {
      query: `
        query Query($username: String!) {
          checkIfUsernameIsTaken(username: $username){
            isTaken
          }
        }
      `,
      variables: {
        username: username,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.checkIfUsernameIsTaken.isTaken;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  getUser() {
    const graphQLquery = {
      query: `
        {
          getUser {
            email _id profilePicture { link } emailVerified name role username phoneNumber 
          }
        }
      `,
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.getUser;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  fetchProfile(username: string) {
    const graphQLquery = {
      query: `
        query Query($username: String!) {
          fetchProfile(username: $username){
            user { _id profilePicture { link }  name role username achievements { _id title description quizToComplete lockedDescription secondPersonDescription iconUrl lockedIconUrl isUnlocked meta { claimedOn createdAt } } }
            submissions { _id quizId { title difficulty } status }
            creations { _id title difficulty }
            playerStats { attempted { easy medium hard } passed { easy medium hard } previewed { easy medium hard } }
            creatorStats { accepted { easy medium hard } rejected { easy medium hard } pending { easy medium hard } }
            quizStats { easy medium hard }
          }
        }
      `,
      variables: {
        username: username,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          if (data.fetchProfile.submissions) {
            const submissions = data.fetchProfile.submissions;
            data.fetchProfile.quizzes = submissions.map((result: any) => {
              return {
                _id: result._id,
                ...result.quizId,
                quizStatus: result.status,
              };
            });
          } else {
            data.fetchProfile.quizzes = data.fetchProfile.creations;
          }
          return data.fetchProfile;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateProfile(field: string, value: string) {
    const graphQLquery = {
      query: `
        mutation Mutation($field: String!, $value: String!) {
          updateUser(field: $field, value: $value){
            Success
          }
        }
      `,
      variables: {
        field: field,
        value: value,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.updateUser.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updatePassword(password: { currentPassword: string; newPassword: string }) {
    const graphQLquery = {
      query: `
        mutation Mutation($currentPassword: String!, $newPassword: String!) {
          updatePassword(currentPassword: $currentPassword, newPassword: $newPassword){
            Success
          }
        }
      `,
      variables: {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.updatePassword.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateEmail(credentials: any) {
    let email = credentials.email;
    let password = credentials.password;
    const graphQLquery = {
      query: `
        mutation Mutation($email: String!, $password: String!) {
          updateEmail(email: $email, password: $password){
            Success
          }
        }
      `,
      variables: {
        email: email,
        password: password,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.updateEmail.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateAddress(address: any) {
    let city = address.city;
    let state = address.state;
    const graphQLquery = {
      query: `
        mutation Mutation($city: String!, $state: String!) {
          updateAddress(city: $city, state: $state){
            success
          }
        }
      `,
      varibles: {
        city: city,
        state: state,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.updateAddress.success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateProfileImage(imageData: FormData) {
    return this.httpClient
      .post(environment.backendUrl + '/account/updateProfileImage', imageData)
      .pipe(
        tap((profileUrl: any) => {
          this.user!.profilePicture!.link = profileUrl;
        }),
        catchError((err) => {
          console.log(err);

          return this.handleError(err);
        })
      );
  }

  deleteProfileImage() {
    return this.httpClient
      .post(environment.backendUrl + '/account/deleteProfileImage', {
        userId: this.user?.userId,
      })
      .pipe(
        tap(({ Success }: any) => {
          if (Success) {
            this.user!.profilePicture!.link = '';
          }
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  private handleError(error: any) {
    let message = error.error.errors[0].message;
    return throwError(() => {
      return { message };
    });
  }
}
