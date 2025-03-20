export interface NewUser {
    userId?: string,
    username: string,
    name?: string,
    email: string,
    password: string,
    role: string,
    state?: string,
    city?: string,
    phoneNumber?: string,
    imageUrl?: string
}

export interface RegisterUser {
    userId?: string,
    username: string,
    email: string,
    password: string,
    role: string
}
