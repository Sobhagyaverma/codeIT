package com.codeit.modules.problems;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.codeit.config.RedisConfig.RedisJsonHelper;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class ProblemCacheService {

    private static final String KEY_PUBLIC_PREFIX = "problem:public:";
    private static final String KEY_JUDGE_PREFIX = "problem:judge:";
    private static final String KEY_ALL = "problem:all";

    private static final TypeReference<List<Problem>> PROBLEM_LIST_TYPE = new TypeReference<>() {};

    private final StringRedisTemplate redisTemplate;
    private final RedisJsonHelper redisJsonHelper;
    private final boolean enabled;
    private final long ttlSeconds;

    public ProblemCacheService(
            ObjectProvider<StringRedisTemplate> redisTemplateProvider,
            RedisJsonHelper redisJsonHelper,
            @Value("${codeit.redis.enabled:false}") boolean redisEnabled,
            @Value("${codeit.cache.problem-ttl-seconds}") long ttlSeconds) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.redisJsonHelper = redisJsonHelper;
        this.enabled = redisEnabled && this.redisTemplate != null;
        this.ttlSeconds = ttlSeconds;
    }

    public Optional<Problem> getPublicById(Integer id) {
        if (!enabled) {
            return Optional.empty();
        }
        String json = redisTemplate.opsForValue().get(KEY_PUBLIC_PREFIX + id);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, Problem.class));
    }

    public void putPublic(Integer id, Problem problem) {
        if (!enabled) {
            return;
        }
        String json = redisJsonHelper.toJson(withoutTestCases(problem));
        redisTemplate.opsForValue().set(KEY_PUBLIC_PREFIX + id, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public Optional<Problem> getForJudge(Integer id) {
        if (!enabled) {
            return Optional.empty();
        }
        String json = redisTemplate.opsForValue().get(KEY_JUDGE_PREFIX + id);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, Problem.class));
    }

    public void putForJudge(Integer id, Problem problem) {
        if (!enabled) {
            return;
        }
        String json = redisJsonHelper.toJson(problem);
        redisTemplate.opsForValue().set(KEY_JUDGE_PREFIX + id, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public Optional<List<Problem>> getAll() {
        if (!enabled) {
            return Optional.empty();
        }
        String json = redisTemplate.opsForValue().get(KEY_ALL);
        return Optional.ofNullable(redisJsonHelper.fromJson(json, PROBLEM_LIST_TYPE));
    }

    public void putAll(List<Problem> problems) {
        if (!enabled) {
            return;
        }
        List<Problem> publicProblems = problems.stream().map(this::withoutTestCases).toList();
        String json = redisJsonHelper.toJson(publicProblems);
        redisTemplate.opsForValue().set(KEY_ALL, json, ttlSeconds, TimeUnit.SECONDS);
    }

    public void invalidate(Integer problemId) {
        if (!enabled) {
            return;
        }
        redisTemplate.delete(KEY_PUBLIC_PREFIX + problemId);
        redisTemplate.delete(KEY_JUDGE_PREFIX + problemId);
        redisTemplate.delete(KEY_ALL);
    }

    public void invalidateAll() {
        if (!enabled) {
            return;
        }
        var keys = redisTemplate.keys("problem:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private Problem withoutTestCases(Problem problem) {
        if (problem == null) {
            return null;
        }
        Problem copy = new Problem();
        copy.setId(problem.getId());
        copy.setTitle(problem.getTitle());
        copy.setDescription(problem.getDescription());
        copy.setDifficulty(problem.getDifficulty());
        copy.setTopics(problem.getTopics());
        copy.setExamples(problem.getExamples());
        copy.setConstraintsData(problem.getConstraintsData());
        return copy;
    }
}
