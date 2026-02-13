export type Role = "admin" | "manager" | "user" | "viewer";

export interface LocalUser {
	userNm: string
	email: string
	roles: Role[]
	avatar?: string
	lookupSequence?: number
}

/**
 * Authentication token with expiration and user data
 */
export interface AuthToken {
	value: string
	expiresAt: string
	lookupSequence: number
	user: LocalUser
}

export interface AuthState {
	isAuthenticated: boolean
	user: LocalUser | null
	token: AuthToken | null
	loading: boolean
	error: string | null
}

export interface LoginCredentials {
	userNm: string
	password: string
}

export interface AuthContextType {
	authState: AuthState
	login: (credentials: LoginCredentials) => Promise<void>
	logout: () => void
}
