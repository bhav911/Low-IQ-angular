import { question } from "./quiz.model"

export type genQuestionModel = {
    title: string,
    description: string,
    difficulty: string,
    questions: question[]
}