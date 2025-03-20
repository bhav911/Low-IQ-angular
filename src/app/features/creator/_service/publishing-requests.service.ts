import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { User } from "../../../core/models/User.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environment/environment";
import { catchError, filter, map, throwError } from "rxjs";
import { Message } from "../../../core/models/request.model";

@Injectable({
  providedIn: 'root'
})
export class PublishingRequestsService {

  private authService = inject(AuthService)
  private httpClient = inject(HttpClient)

  user: User | null | undefined = undefined

  constructor() {
    this.authService.$user
      .pipe(filter((u) => u !== undefined))
      .subscribe((user) => {
        this.user = user;
      });
  }

  // addNewRequest(type: requestType[], quizId?: string, quizTitle?: string) {
  //   let requestObject = {
  //     creatorId: this.user?.userId!,
  //     quizId: quizId ?? null,
  //     quizTitle,
  //     createdOn: serverTimestamp(),
  //     updatedOn: serverTimestamp(),
  //     feedbackCount: 0,
  //     status: requestStatus.pending,
  //     type: type,
  //     acknowledged: true
  //   }
  //   return from(this.fire.collection('publishingRequests')
  //     .add(requestObject))
  //     .pipe(
  //       map(requestWrapped => {
  //         return requestWrapped.id
  //       }),
  //       catchError(err => {
  //         console.log('Failed to add request ' + err);
  //         return throwError(() => "Something went wrong")
  //       })
  //     )

  // }

  // updateRequest(type: requestType[], requestId: string) {
  //   return from(this.fire.collection('publishingRequests')
  //     .doc(requestId)
  //     .update({
  //       updatedOn: serverTimestamp(),
  //       type: type,
  //       status: requestStatus.pending,
  //     }))
  //     .pipe(
  //       catchError(err => {
  //         console.log('Failed to add request ' + err);
  //         return throwError(() => "Something went wrong")
  //       })
  //     )
  // }

  fetchRequests(page: number) {
    const graphQLquery = {
      query: `
            query Query($page: Int!) {
              fetchRequests(page: $page){
                _id creatorId { _id username profilePicture { link } } quizId { _id title } type messageCount status createdAt hasSeen
              }
            }
          `,
      variables: {
        page: page
      }
    }
    return this.httpClient.post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          return data.fetchRequests
        }),
        catchError(err => {
          return this.handleError(err);
        })
      )
  }

  fetchConversation(requestId: string, page: number) {
    const graphQLquery = {
      query: `
            query Query($requestId: String!, $page: Int!) {
              fetchConversation(requestId: $requestId, page: $page){
                _id userId { _id username profilePicture { link } role } message status createdAt
              }
            }
          `,
      variables: {
        requestId: requestId,
        page: page
      }
    }
    return this.httpClient.post(environment.backendUrl + '/graphql', graphQLquery)
      .pipe(
        map(({ data }: any) => {
          const messages = [...data.fetchConversation]
          messages.forEach((message: Message) => {
            const date = new Date(+message.createdAt);
            message.createdAt = date.toLocaleDateString()
          });
          return messages
        }),
        catchError(err => {
          return this.handleError(err);
        })
      )
  }

  createFeedback(requestId: string, feedback: string, status: string) {
    const gqlQuery = {
      query: `
            mutation Mutation($requestId: String!, $feedback: String!, $status: RequestStatus!){
              createFeedback(requestId: $requestId, feedback: $feedback, status: $status){
                Success
              }
            }
          `,
      variables: {
        requestId: requestId,
        feedback: feedback,
        status: status
      }
    }

    return this.httpClient.post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.createFeedback.Success
        }),
        catchError(err => {
          return this.handleError(err)
        })
      )
  }

  // updateRequestStatus(requestId: string, status: requestStatus) {
  //   return from(this.fire.collection('publishingRequests')
  //     .doc(requestId)
  //     .update({
  //       acknowledged: false,
  //       feedbackCount: increment(1),
  //       status: status,
  //       updatedOn: serverTimestamp()
  //     }))
  //     .pipe(
  //       map(() => true),
  //       catchError(err => {
  //         console.log('Failed to update request status: ' + err);
  //         return throwError(() => "Something went wrong")
  //       })
  //     )


  // }

  // markRequestAsSeen(requestId: string) {
  //   return from(this.fire.collection('publishingRequests')
  //     .doc(requestId)
  //     .update({
  //       acknowledged: true
  //     }))
  //     .pipe(
  //       map(() => true),
  //       catchError(err => {
  //         console.log("Failed to mark request as seen: " + err);
  //         return of(false);
  //       })
  //     )
  // }

  // formatdate(date: string) {
  //   let dateParts = date.split(' ');
  //   let time = dateParts[4].split(':');
  //   let dateFormat = dateParts[2] + ' ' + dateParts[1] + ', ' + dateParts[3].substring(2) + '+' + time[0] + ':' + time[1]
  //   return dateFormat
  // }

  private handleError(error: any) {
    console.log(error);

    let message = error.error.errors[0].message;
    console.log(message);
    return throwError(() => {
      return { message };
    });
  }

}
