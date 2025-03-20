import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { CategoryService } from '../../features/category/_services/category.service';
import { AccountService } from './account.service';
import { BehaviorSubject, catchError, map, throwError } from 'rxjs';
import { quiz } from '../models/quiz.model';
import { User } from '../models/User.model';
import { environment } from '../../../environment/environment';
import { genQuestionModel } from '../models/generatedQuestion.model';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  // private publishingRequestsService = inject(PublishingRequestsService);

  private _quiz = new BehaviorSubject<quiz[] | null>(null);
  $quiz = this._quiz.asObservable();

  private user: User | null | undefined = undefined;

  constructor() {
    this.authService.userValue.subscribe((user) => {
      this.user = user;
    });
  }

  getQuiz(quizId: string, fields: string) {
    const graphQLquery = {
      query: `
        query Query($quizId: String!) {
          getQuiz(id: $quizId){
            ${fields}
          }
        }
      `,
      variables: {
        quizId: quizId,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.getQuiz;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  generateQuiz(quizDescription: string, numberOfQuestion: number) {
    return this.httpClient
      .get<genQuestionModel>(environment.backendUrl + '/quiz/generateQuiz', {
        params: {
          quizDescription,
          numberOfQuestion,
        },
      })
      .pipe(
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  getAllQuizzes(fields: string, filters: {}) {
    const graphQLquery = {
      query: `
        query Query($filters: FilterInputData!) {
          getAllQuizzes(filterInput: $filters){
            ${fields}
          }
        }
      `,
      variables: {
        filters: filters,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.getAllQuizzes;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  getCreatorQuizzes(filters: {}) {
    const graphQLquery = {
      query: `
        query Query($filters: FilterInputData!) {
          getAllQuizzes(filterInput: $filters){
            _id title difficulty
          }
        }
      `,
      variables: {
        filters: filters,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.getAllQuizzes;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  getQuizSet(fields: string, filters: {}) {
    const graphQLquery = {
      query: `
        query Query($filters: FilterInputData!) {
          getQuizSet(filterInput: $filters){
            quizzes { ${fields}}
            categories { _id title meta { easy medium hard }}
            quizStats { easy medium hard }
          }
        }
      `,
      variables: {
        filters: filters,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.getQuizSet;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  createQuiz(quiz: quiz) {
    const graphQLquery = {
      query: `
        mutation Mutation($quizInput: QuizInputData) {
          createQuiz(quizInput: $quizInput)
        }
      `,
      variables: {
        quizInput: { ...quiz },
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.createQuiz;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateQuiz(quiz: quiz) {
    const graphQLquery = {
      query: `
        mutation Mutation($quizInput: UpdateQuizInputData) {
          updateQuiz(quizInput: $quizInput)
        }
      `,
      variables: {
        quizInput: { ...quiz },
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.updateQuiz;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateQuizReaction(quizId: string, reaction: string) {
    const gqlQuery = {
      query: `
        mutation Mutation($quizId: String!, $reaction: ReactionStatus!){
          updateQuizReaction(quizId: $quizId, userReaction: $reaction){
            Success
          }
        }
      `,
      variables: {
        quizId: quizId,
        reaction: reaction,
      },
    };

    return this.httpClient
      .post(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.updateQuizReaction.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  submitQuiz(quizId: string, userAnswers: {}) {
    const graphQLquery = {
      query: `
        mutation Mutation($submitionInput: QuizSubmitionInputData!) {
          submitQuiz(submitionInput: $submitionInput)
        }
      `,
      variables: {
        submitionInput: {
          quizId: quizId,
          userAnswers,
        },
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.submitQuiz;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  isQuizAttempted(quizId: string) {
    const graphQLquery = {
      query: `
        query Query($quizId: String!) {
          isQuizAttempted(quizId: $quizId){
            Success resultId
          }
        }
      `,
      variables: {
        quizId: quizId,
      },
    };
    return this.httpClient
      .post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.isQuizAttempted;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  reset() {
    this._quiz.next(null);
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
