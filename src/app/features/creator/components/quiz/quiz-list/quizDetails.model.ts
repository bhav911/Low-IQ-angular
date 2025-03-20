import { quiz } from "../../../../../core/models/quiz.model";

export interface quizModel {
    $index: number,
    role?: string,
    quiz: quiz;
}