package com.codeit.modules.submission;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.codeit.config.RedisConfig.RedisJsonHelper;
import com.codeit.modules.submission.dto.TestCaseDTO;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class TestCaseCacheService {

    private static final String KEY_PREFIX = "testcases:problem:";
    private static final TypeReference<List<TestCaseDTO>> TEST_CASE_LIST_TYPE = new TypeReference<>() {};

    private final StringRedisTemplate redisTemplate;
    private final RedisJsonHelper redisJsonHelper;
    private final TestCaseParser testCaseParser;
    private final long ttlSeconds;

    public TestCaseCacheService(
            StringRedisTemplate redisTemplate,
            RedisJsonHelper redisJsonHelper,
            TestCaseParser testCaseParser,
            @Value("${codeit.cache.testcase-ttl-seconds}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.redisJsonHelper = redisJsonHelper;
        this.testCaseParser = testCaseParser;
        this.ttlSeconds = ttlSeconds;
    }

    public List<TestCaseDTO> get(Integer problemId, String rawTestCasesJson) {
        String key = KEY_PREFIX + problemId;
        String json = redisTemplate.opsForValue().get(key);
        if (json != null && !json.isBlank()) {
            List<TestCaseDTO> cached = redisJsonHelper.fromJson(json, TEST_CASE_LIST_TYPE);
            if (cached != null) {
                return cached;
            }
        }

        List<TestCaseDTO> testCases = testCaseParser.parse(rawTestCasesJson);
        redisTemplate.opsForValue().set(key, redisJsonHelper.toJson(testCases), ttlSeconds, TimeUnit.SECONDS);
        return testCases;
    }

    public void invalidate(Integer problemId) {
        redisTemplate.delete(KEY_PREFIX + problemId);
    }

    public void invalidateAll() {
        var keys = redisTemplate.keys(KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
