import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  first,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';
import { User } from '../models/User.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private _user = new BehaviorSubject<User | null | undefined>(undefined);
  $user = this._user.asObservable();

  constructor() {
    const gqlQuery = {
      query: `
                {
                    authStatus{ userId token username role profilePicture { link } notifications { _id userId content hasSeen iconLink type navigationRoute createdAt } } 
                }
            `,
    };

    this.http
      .post<User | null>(environment.backendUrl + '/graphql', gqlQuery)
      .subscribe({
        next: ({ data }: any) => {
          this._user.next(data.authStatus);
          if (!data.authStatus) {
            this.emptyLocalStorage();
          }
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  get userValue() {
    return this.$user.pipe(filter((u) => u !== undefined));
  }

  get directUserValue() {
    return this._user.value;
  }

  switchProfile() {
    let currentRole = this._user.value!.role;
    let anotherRole = currentRole === 'creator' ? 'player' : 'creator';
    const token = localStorage.getItem('token-' + anotherRole);
    if (!token) {
      return of({ Success: false });
    }
    return this.validateToken(token).pipe(
      map((user) => {
        if (!user) {
          localStorage.removeItem('token-' + anotherRole);
        } else {
          this._user.next(user);
          localStorage.setItem('role', user.role);
        }
        return { Success: Boolean(user) };
      })
    );
  }

  validateToken(token: string) {    
    const gqlQuery = {
      query: `
                query Query($token: String!){
                    validateToken(token: $token){
                        userId token username role profilePicture { link } notifications { _id userId content hasSeen iconLink type navigationRoute createdAt }
                    }
                }
            `,
      variables: {
        token: token,
      },
    };

    return this.http
      .post<User | null>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.validateToken;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  emptyLocalStorage() {
    const role = localStorage.getItem('role');
    if (!role) {
      localStorage.clear();
    }
    localStorage.removeItem('token-' + role);
    localStorage.removeItem('role');
    localStorage.removeItem('expiryDate');
  }

  authenticateUser(userCredentials: any) {
    let graphQLQuery = {
      query: `
                query Query($email: String!, $password: String!) {
                    loginUser(email: $email, password: $password) {
                        userId
                        token
                        username
                        role
                        profilePicture { link } 
                        notifications { _id userId content hasSeen iconLink type navigationRoute createdAt }
                    }
                }
            `,
      variables: {
        email: userCredentials.email,
        password: userCredentials.password,
      },
    };
    return this.http
      .post(environment.backendUrl + '/graphql', graphQLQuery)
      .pipe(
        tap(({ data }: any) => {
          localStorage.setItem(
            `token-${data.loginUser.role}`,
            data.loginUser.token
          );
          localStorage.setItem('role', data.loginUser.role);
          const remainingMiliseconds = 60 * 60 * 24 * 30 * 1000;
          const expiryDate = new Date(
            new Date().getTime() + remainingMiliseconds
          );
          localStorage.setItem('expiryDate', expiryDate.toISOString());
          this._user.next(data.loginUser);
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  registerUser(userInfo: any) {
    let graphQLQuery = {
      query: `
                mutation createUser($username: String!, $email: String!, $password: String!, $role: Role!) {
                    createUser(userInput: {
                        username: $username,
                        email: $email,
                        password: $password,
                        role: $role
                    })
                    { userId token username role profilePicture { link } notifications { _id userId content hasSeen iconLink type navigationRoute createdAt } }
                }
            `,
      variables: {
        username: userInfo.username,
        email: userInfo.email,
        password: userInfo.password,
        role: userInfo.role,
      },
    };

    return this.http
      .post<User>(environment.backendUrl + '/graphql', graphQLQuery)
      .pipe(
        map(({ data }: any) => {
          this._user.next(data.createUser);
          localStorage.setItem(
            `token-${data.createUser.role}`,
            data.createUser.token
          );
          localStorage.setItem('role', data.createUser.role);
          const remainingMiliseconds = 60 * 60 * 24 * 30 * 1000;
          const expiryDate = new Date(
            new Date().getTime() + remainingMiliseconds
          );
          localStorage.setItem('expiryDate', expiryDate.toISOString());
          return true;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  resetPassword(userObject: any) {
    const graphQLQuery = {
      query: `
                mutation resetPassword($userId: String!, $password: String!, $token: String!)  {
                    resetPassword(resetPasswordInput: {
                        userId: $userId,    
                        password: $password, 
                        token: $token
                    })
                    { Success }
                }
            `,
      variables: {
        userId: userObject.userId,
        password: userObject.password,
        token: userObject.token,
      },
    };
    return this.http
      .post<string>(environment.backendUrl + '/graphql', graphQLQuery)
      .pipe(
        map(({ data }: any) => {
          return data.resetPassword;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  validatePasswordResetToken(token: string) {
    return this.http
      .post(environment.backendUrl + '/account/validatePasswordResetToken', {
        token: token,
      })
      .pipe(
        map(({ userId }: any) => {
          return userId;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  sendPasswordResetMail(email: string) {
    return this.http
      .post(environment.backendUrl + '/account/sendPassResetMail', {
        email: email,
      })
      .pipe(
        map(({ Success }: any) => {
          console.log('success: ' + Success);
          return Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  sendOTPforEmailVerification() {
    return this.http
      .post(environment.backendUrl + '/account/sendOTP', {
        userId: this._user.value!.userId,
      })
      .pipe(
        map(({ Success }: any) => {
          console.log('success: ' + Success);
          return Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  submitOTPforEmailVerification(otp: string) {
    return this.http
      .post(environment.backendUrl + '/account/verifyOTP', {
        otp: otp,
      })
      .pipe(
        map(({ Success }: any) => {
          if (Success) {
            const updatedUser = { ...this._user.value! };
            updatedUser.emailVerified = true;
            this._user.next(updatedUser);
          }
          console.log('success: ' + Success);
          return Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  logout() {
    this._user.next(null);
    const role = localStorage.getItem('role');
    this.emptyLocalStorage();
    if (role) {
      const anotherRole = role === 'creator' ? 'player' : 'creator';
      const anotherToken = localStorage.getItem('token-' + anotherRole);
      if (anotherToken) {
        this.validateToken(anotherToken).subscribe({
          next: (user) => {
            if (user) {
              localStorage.setItem(`token-${user.role}`, user.token);
              localStorage.setItem('role', user.role);
              const remainingMiliseconds = 60 * 60 * 24 * 30 * 1000;
              const expiryDate = new Date(
                new Date().getTime() + remainingMiliseconds
              );
              localStorage.setItem('expiryDate', expiryDate.toISOString());
              this._user.next(user);
            } else {
              localStorage.clear();
            }
          },
        });
      }
    }
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
