import { quiz } from "./quiz.model";
import { User } from "./User.model";

export interface Result {
    _id: string,
    quizId?: quiz,
    userId: User,
    status: "failed" | "passed" | "previewed",
    score: number,
    userAnswers: {
        questionId: string,
        optionId: string,
    }[],
    createdAt: string
}