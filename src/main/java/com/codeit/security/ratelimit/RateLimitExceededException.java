package com.codeit.security.ratelimit;

/**
 * Thrown when a client exceeds a configured rate limit.
 * Handled by GlobalExceptionHandler → HTTP 429 JSON body.
 */
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;
    private final String policy;

    public RateLimitExceededException(String policy, long retryAfterSeconds) {
        super("Too many requests. Please try again later.");
        this.policy = policy;
        this.retryAfterSeconds = Math.max(retryAfterSeconds, 1);
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public String getPolicy() {
        return policy;
    }
}
