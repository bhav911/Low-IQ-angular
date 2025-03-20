import { quiz } from "./quiz.model"
import { User } from "./User.model"

export type Request = {
    _id: string,
    creatorId: User,
    type: requestType[],
    quizId: quiz,
    messageCount: number,
    createdAt: string,
    status: requestStatus,
    conversation?: Message[],
    hasSeen: boolean
}

export type Message = {
    _id: string,
    userId: User,
    message: string
    status: requestStatus,
    createdAt: string
}

export enum requestStatus {
    'pending' = 'pending',
    'rejected' = 'rejected',
    'accepted' = 'accepted'
}

export enum requestType {
    'new quiz' = 'new quiz',
    'edit quiz' = 'edit quiz',
    'new category' = 'new category'
}