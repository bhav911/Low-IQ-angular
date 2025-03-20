export type Comment = {
    _id?: string,
    parentCommentId?: string,
    text: string,
    createdAt: any,
    reaction: "liked" | "disliked" | null,
    reactionCount: {
        disliked: number,
        liked: number,
    }
    userId: {
        _id: string,
        username: string,
        profilePicture?: {
            link: string
        }
    }
    updatedAt: any,
    repliesCount: number,
    replies?: Comment[],
    isDeleted: boolean
}