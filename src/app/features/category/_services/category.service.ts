import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { catchError, filter, map, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/User.model';
@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private httpClient = inject(HttpClient);
    private authService = inject(AuthService)

    user: User | null | undefined = undefined

    constructor() {
        this.authService.$user
            .pipe(filter((u) => u !== undefined))
            .subscribe((user) => {
                this.user = user;
            });
    }

    fetchCategory(categoryId: string) {
        const userStatsQuery = this.user?.role === 'player'
            ? "playerStats { attempted { easy medium hard } }"
            : "creatorStats { accepted { easy medium hard } rejected { easy medium hard } pending { easy medium hard } }";
        const gqlQuery = {
            query: `
                query Query($categoryId: String!) {
                    fetchCategory(_id: $categoryId){
                        _id title quizzes { _id title difficulty isAttempted quizStatus } meta { easy medium hard } ${userStatsQuery}
                    }
                }
            `,
            variables: {
                categoryId: categoryId
            }
        }

        return this.httpClient.post(environment.backendUrl + '/graphql', gqlQuery)
            .pipe(
                map(({ data }: any) => {
                    return data.fetchCategory
                }),
                catchError((err) => {
                    return this.handleError(err)
                })
            )
    }

    getAllCategories(fields: string, action?: string) {
        const gqlQuery = {
            query: `
                {
                    getCategories {
                        ${fields}
                    }   
                }
            `
        }

        return this.httpClient.post(environment.backendUrl + '/graphql', gqlQuery, {
            params: {
                action: action ?? "none"
            }
        })
            .pipe(
                map(({ data }: any) => {
                    return data.getCategories
                }),
                catchError((err) => {
                    return this.handleError(err)
                })
            )
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
