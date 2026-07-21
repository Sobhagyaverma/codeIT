package com.codeit.modules.competition;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.codeit.config.RedisConfig.RedisJsonHelper;
import com.codeit.modules.competition.dto.LeaderboardEntry;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class LeaderboardCacheService {

    private static final String KEY_PREFIX = "leaderboard:competition:";
    private static final TypeReference<List<LeaderboardEntry>> LIST_TYPE = new TypeReference<>() {};

    private final StringRedisTemplate redisTemplate;
    private final RedisJsonHelper redisJsonHelper;
    private final CompetitionRepository competitionRepository;
    private final boolean enabled;
    private final long ttlSeconds;

    public LeaderboardCacheService(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider,
            RedisJsonHelper redisJsonHelper,
            CompetitionRepository competitionRepository,
            @Value("${codeit.redis.enabled:false}") boolean redisEnabled,
            @Value("${codeit.cache.leaderboard-ttl-seconds}") long ttlSeconds) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.redisJsonHelper = redisJsonHelper;
        this.competitionRepository = competitionRepository;
        this.enabled = redisEnabled && this.redisTemplate != null;
        this.ttlSeconds = ttlSeconds;
    }

    public Optional<List<LeaderboardEntry>> get(Integer competitionId) {
        if (!enabled) {
            return Optional.empty();
        }
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + competitionId);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, LIST_TYPE));
    }

    public void put(Integer competitionId, List<LeaderboardEntry> entries) {
        if (!enabled) {
            return;
        }
        String json = redisJsonHelper.toJson(entries);
        redisTemplate.opsForValue().set(KEY_PREFIX + competitionId, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public List<LeaderboardEntry> refresh(Integer competitionId) {
        List<LeaderboardEntry> entries = competitionRepository.getLeaderboard(competitionId);
        put(competitionId, entries);
        return entries;
    }

    public void invalidate(Integer competitionId) {
        if (!enabled) {
            return;
        }
        redisTemplate.delete(KEY_PREFIX + competitionId);
    }
}
