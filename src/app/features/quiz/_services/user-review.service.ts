import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/User.model';
import { Comment } from '../../../core/models/comment.model';
import { catchError, from, map, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class UserReviewService {
  commentsLimit = 4;
  subCommentsLimit = 4;
  previousComment?: Comment | undefined = undefined;
  previousSubComment?: Comment | undefined = undefined;
  sortOrder = 0;

  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private user: User | null | undefined = undefined;

  constructor() {
    this.authService.userValue.subscribe((user) => {
      this.user = user;
    });
  }

  createComment(comment: string, quizId: string, parentCommentId?: string) {
    const gqlQuery = {
      query: `
        mutation Mutation($CommentInput: CommentInputData!){
          createComment(CommentInput: $CommentInput){
            _id userId { _id username profilePicture {link} } text reactionCount { liked } createdAt
          }
        }
      `,
      variables: {
        CommentInput: {
          text: comment,
          quizId: quizId,
          parentCommentId: parentCommentId,
        },
      },
    };

    return this.httpClient
      .post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.createComment;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateComment(comment: string, commentId: string) {
    const gqlQuery = {
      query: `
        mutation Mutation($CommentInput: CommentInputData!){
          updateComment(CommentInput: $CommentInput){
            text
          }
        }
      `,
      variables: {
        CommentInput: {
          text: comment,
          _id: commentId,
        },
      },
    };

    return this.httpClient
      .post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.updateComment;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  deleteComment(commentId: string) {
    const gqlQuery = {
      query: `
        mutation Mutation($commentId: String!){
          deleteComment(commentId: $commentId){
            Success
          }
        }
      `,
      variables: {
        commentId: commentId,
      },
    };

    return this.httpClient
      .post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.deleteComment.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  fetchComments(quizId: string, page: number, sortOrder: number) {
    const gqlQuery = {
      query: `
        query Query($quizId: String!, $page: Int!, $sortOrder: Int!){
          fetchComments(quizId: $quizId, page: $page, sortOrder: $sortOrder){
            _id reactionCount { liked } repliesCount text reaction createdAt userId { _id username profilePicture {link} }
          }
        }
      `,
      variables: {
        quizId: quizId,
        page: page,
        sortOrder: sortOrder,
      },
    };

    return this.httpClient
      .post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.fetchComments;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  updateCommentReaction(commentId: string, reaction: string) {
    const gqlQuery = {
      query: `
        mutation Mutation($commentId: String!, $reaction: ReactionStatus!){
          updateCommentReaction(commentId: $commentId, reaction: $reaction){
            Success
          }
        }
      `,
      variables: {
        commentId: commentId,
        reaction: reaction,
      },
    };

    return this.httpClient
      .post(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.updateCommentReaction.Success;
        }),
        catchError((err) => {
          return this.handleError(err);
        })
      );
  }

  fetchReplies(commentId: string, page: number) {
    const gqlQuery = {
      query: `
        query Query($commentId: String!, $page: Int!){
          fetchReplies(commentId: $commentId, page: $page){
            _id reactionCount { liked } text reaction createdAt userId { _id username profilePicture {link} }
          }
        }
      `,
      variables: {
        commentId: commentId,
        page: page,
      },
    };

    return this.httpClient
      .post<Comment>(environment.backendUrl + '/graphql', gqlQuery)
      .pipe(
        map(({ data }: any) => {
          return data.fetchReplies;
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
