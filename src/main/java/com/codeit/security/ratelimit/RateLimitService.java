package com.codeit.security.ratelimit;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Fixed-window counter rate limiter.
 *
 * Storage: Redis when enabled, otherwise in-memory.
 * Auth policies can fail-closed on Redis errors (production default).
 */
@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    /** Policies that must not fail-open under Redis outage when fail-closed is on. */
    private static final Set<String> AUTH_FAIL_CLOSED_POLICIES = Set.of(
            "login",
            "register",
            "forgot-password",
            "verify-email",
            "change-password",
            "contact");

    private final RateLimitProperties properties;
    private final StringRedisTemplate redis;
    private final boolean redisEnabled;
    private final boolean failClosedOnRedisError;
    private final ConcurrentHashMap<String, MemoryWindow> memory = new ConcurrentHashMap<>();

    public RateLimitService(
            RateLimitProperties properties,
            ObjectProvider<StringRedisTemplate> redisProvider,
            @Value("${codeit.redis.enabled:false}") boolean redisEnabled,
            @Value("${codeit.ratelimit.fail-closed-on-redis-error:false}") boolean failClosedOnRedisError) {
        this.properties = properties;
        this.redis = redisProvider.getIfAvailable();
        this.redisEnabled = redisEnabled && this.redis != null;
        this.failClosedOnRedisError = failClosedOnRedisError;
        if (this.redisEnabled) {
            log.info(
                    "RateLimitService using Redis backend (authFailClosed={})",
                    failClosedOnRedisError);
        } else {
            log.info(
                    "RateLimitService using in-memory backend (enable Redis with codeit.redis.enabled=true)");
        }
    }

    /**
     * Check-and-consume one request for the given policy/dimension/id.
     */
    public RateLimitResult check(String policy, String dimension, String id, int limit, int windowSeconds) {
        if (!properties.isEnabled()) {
            return RateLimitResult.allowUnlimited();
        }
        if (limit <= 0 || windowSeconds <= 0) {
            return RateLimitResult.allowUnlimited();
        }

        String key = RateLimitKeyBuilder.build(policy, dimension, id, windowSeconds);
        long retryAfter = secondsUntilWindowEnd(windowSeconds);

        try {
            long count = redisEnabled ? incrRedis(key, windowSeconds) : incrMemory(key, windowSeconds);
            if (count > limit) {
                return new RateLimitResult(false, limit, 0, retryAfter, key);
            }
            int remaining = (int) Math.max(0, limit - count);
            return new RateLimitResult(true, limit, remaining, 0, key);
        } catch (Exception ex) {
            if (redisEnabled
                    && failClosedOnRedisError
                    && AUTH_FAIL_CLOSED_POLICIES.contains(policy)) {
                log.error(
                        "Rate limit Redis failure for auth policy={} key={} — DENYING request: {}",
                        policy,
                        key,
                        ex.toString());
                return new RateLimitResult(false, limit, 0, Math.max(1, retryAfter), key);
            }
            log.warn("Rate limit check failed for key={} — allowing request: {}", key, ex.toString());
            return RateLimitResult.allowUnlimited();
        }
    }

    /** Convenience: throw RateLimitExceededException when blocked. */
    public void checkOrThrow(String policy, String dimension, String id, int limit, int windowSeconds) {
        RateLimitResult result = check(policy, dimension, id, limit, windowSeconds);
        if (!result.allowed()) {
            throw new RateLimitExceededException(policy, result.retryAfterSeconds());
        }
    }

    /**
     * Enforce burst + sustained + daily for one user. All three must pass.
     * Dimension includes the tier so Redis keys never collide across windows.
     */
    public void checkTieredOrThrow(
            String policy,
            String userId,
            RateLimitProperties.TieredEndpointLimit tiers) {
        String id = userId == null || userId.isBlank() ? "unknown" : userId;
        checkOrThrow(policy, "user-burst", id, tiers.getBurst().getLimit(), tiers.getBurst().getWindowSeconds());
        checkOrThrow(
                policy,
                "user-sustained",
                id,
                tiers.getSustained().getLimit(),
                tiers.getSustained().getWindowSeconds());
        checkOrThrow(policy, "user-daily", id, tiers.getDaily().getLimit(), tiers.getDaily().getWindowSeconds());
    }

    private long incrRedis(String key, int windowSeconds) {
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, java.time.Duration.ofSeconds(windowSeconds));
        }
        return count == null ? 1L : count;
    }

    private long incrMemory(String key, int windowSeconds) {
        long expiresAt = System.currentTimeMillis() + windowSeconds * 1000L;
        MemoryWindow window = memory.compute(key, (k, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || existing.expiresAtMillis <= now) {
                return new MemoryWindow(new AtomicInteger(0), expiresAt);
            }
            return existing;
        });
        if (memory.size() > 10_000) {
            pruneExpiredMemory();
        }
        return window.count.incrementAndGet();
    }

    private void pruneExpiredMemory() {
        long now = System.currentTimeMillis();
        memory.entrySet().removeIf(e -> e.getValue().expiresAtMillis <= now);
    }

    private static long secondsUntilWindowEnd(int windowSeconds) {
        long epochSec = System.currentTimeMillis() / 1000L;
        long bucket = epochSec / windowSeconds;
        long end = (bucket + 1) * windowSeconds;
        return Math.max(1, end - epochSec);
    }

    private record MemoryWindow(AtomicInteger count, long expiresAtMillis) {
    }
}
