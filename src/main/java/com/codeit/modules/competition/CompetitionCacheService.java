package com.codeit.modules.competition;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.codeit.config.RedisConfig.RedisJsonHelper;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class CompetitionCacheService {

    private static final String KEY_ALL = "competitions:all";
    private static final String KEY_PREFIX = "competition:";
    private static final TypeReference<List<Competition>> LIST_TYPE = new TypeReference<>() {};

    private final StringRedisTemplate redisTemplate;
    private final RedisJsonHelper redisJsonHelper;
    private final long ttlSeconds;

    public CompetitionCacheService(
            StringRedisTemplate redisTemplate,
            RedisJsonHelper redisJsonHelper,
            @Value("${codeit.cache.competition-ttl-seconds}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.redisJsonHelper = redisJsonHelper;
        this.ttlSeconds = ttlSeconds;
    }

    public Optional<List<Competition>> getAll() {
        String json = redisTemplate.opsForValue().get(KEY_ALL);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, LIST_TYPE));
    }

    public void putAll(List<Competition> competitions) {
        String json = redisJsonHelper.toJson(competitions);
        redisTemplate.opsForValue().set(KEY_ALL, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public Optional<Competition> getById(Integer id) {
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + id);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, Competition.class));
    }

    public void putById(Integer id, Competition competition) {
        String json = redisJsonHelper.toJson(competition);
        redisTemplate.opsForValue().set(KEY_PREFIX + id, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public void invalidate(Integer competitionId) {
        redisTemplate.delete(KEY_PREFIX + competitionId);
        redisTemplate.delete(KEY_ALL);
    }

    public void invalidateAll() {
        redisTemplate.delete(KEY_ALL);
    }
}
