package com.codeit.config;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.config.RedisConfig.RedisJsonHelper;

@RestController
@RequestMapping("/api/health")
public class RedisHealthController {

    private static final String KEY = "codeit:health";

    private final StringRedisTemplate redisTemplate;
    private final RedisJsonHelper redisJsonHelper;

    public RedisHealthController(StringRedisTemplate redisTemplate, RedisJsonHelper redisJsonHelper) {
        this.redisTemplate = redisTemplate;
        this.redisJsonHelper = redisJsonHelper;
    }

    @GetMapping("/redis")
    public Map<String, Object> redisHealth() {
        // 1) Plain string SET/GET
        redisTemplate.opsForValue().set(KEY, "ok", 60, TimeUnit.SECONDS);
        String value = redisTemplate.opsForValue().get(KEY);

        // 2) JSON round-trip via RedisJsonHelper
        Map<String, String> payload = Map.of("status", "ok", "source", "codeit");
        String json = redisJsonHelper.toJson(payload);
        redisTemplate.opsForValue().set(KEY + ":json", json, 60, TimeUnit.SECONDS);
        @SuppressWarnings("unchecked")
        Map<String, String> roundTrip = redisJsonHelper.fromJson(
                redisTemplate.opsForValue().get(KEY + ":json"),
                Map.class);

        return Map.of(
                "redis", "connected",
                "pingValue", value,
                "jsonRoundTrip", roundTrip);
    }
}