/**
 * Helper manajemen session ID wasit untuk concurrency lock
 */
const SESSION_STORAGE_KEY = 'padel_scorer_session_id'

export function getClientScorerSessionId(): string {
    if (typeof window === 'undefined') return ''
    try {
        let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
        if (!sessionId) {
            sessionId = crypto.randomUUID()
            sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
        }
        return sessionId
    } catch {
        return ''
    }
}
