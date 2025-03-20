import { inject, Injectable } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { Result } from '../../../core/models/result.model';

@Injectable({
  providedIn: 'root',
})
export class ResultService {
  private httpClient = inject(HttpClient);

  getResult(resultId: string) {
    const gqlQuery = {
      query: `
            query Query($resultId: String!){
              getResult(resultId: $resultId){
                _id quizId { _id title description difficulty totalPoints questionCount categoryId {   _id   title } questions { _id question questionImage point options { _id option isCorrect } } } userId { _id username } score status userAnswers { questionId optionId } createdAt
              }
            }
          `,
      variables: {
        resultId: resultId,
      },
    };

    return this.httpClient
      .post<Result>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.getResult;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  getSubmissions(userId: string, page: number) {
    const gqlQuery = {
      query: `
            query Query($userId: String!, $page: Int!){
              getSubmissions(userId: $userId, page: $page){
                _id quizId { title difficulty } status
              }
            }
          `,
      variables: {
        userId: userId,
        page: page,
      },
    };

    return this.httpClient
      .post<Result>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          const submissions = data.getSubmissions;
          data.getSubmissions = submissions.map((result: any) => {
            return {
              _id: result._id,
              ...result.quizId,
              quizStatus: result.status,
            };
          });
          return data.getSubmissions;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  canProceedToResult(resultId: string) {
    const gqlQuery = {
      query: `
            query Query($resultId: String!){
              canProceedToResult(resultId: $resultId){
                Success resultId
              }
            }
          `,
      variables: {
        resultId: resultId,
      },
    };

    return this.httpClient
      .post<Result>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.canProceedToResult;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  markQuizResultSeen(quizId: string) {
    const graphQLquery = {
      query: `
        mutation Mutation($quizId: String!) {
          markQuizResultSeen(quizId: $quizId){
            Success
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
          return data.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
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
