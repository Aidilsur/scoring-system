/**
 * Konstanta durasi concurrency lock untuk wasit scoring.
 * 2 menit TTL (Time-To-Live).
 */
export const SESSION_LOCK_TTL_MS = 2 * 60 * 1000 // 2 menit

/**
 * Interval pengiriman heartbeat wasit aktif saat tab browser visible (30 detik).
 */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000 // 30 detik
