// Re-export the canonical AuthService from core so existing imports keep working
// while there is a single source of truth.
export { AuthService, AuthResponse, RegisterPayload } from '../../core/services/auth.service';