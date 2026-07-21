package com.codeit.modules.ai;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AiRateLimiter {

    private final int limitPerMinute;
    private final Map<Integer, Window> windows = new ConcurrentHashMap<>();

    public AiRateLimiter(@Value("${codeit.ai.rate-limit-per-minute:20}") int limitPerMinute) {
        this.limitPerMinute = limitPerMinute;
    }

    public void check(Integer userId) {
        long minute = System.currentTimeMillis() / 60_000L;
        Window window = windows.compute(userId, (id, existing) -> {
            if (existing == null || existing.minute != minute) {
                return new Window(minute, new AtomicInteger(0));
            }
            return existing;
        });
        int count = window.count.incrementAndGet();
        if (count > limitPerMinute) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI rate limit exceeded");
        }
    }

    private record Window(long minute, AtomicInteger count) {
    }
}
