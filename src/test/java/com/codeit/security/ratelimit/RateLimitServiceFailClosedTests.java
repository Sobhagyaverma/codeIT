package com.codeit.security.ratelimit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class RateLimitServiceFailClosedTests {

    @Test
    void authPolicyDeniesWhenRedisFailsAndFailClosed() {
        RateLimitService service = newService(failingRedis(), true);
        RateLimitResult result = service.check("login", "ip", "1.2.3.4", 5, 60);
        assertFalse(result.allowed());
    }

    @Test
    void nonAuthPolicyAllowsWhenRedisFailsEvenIfFailClosed() {
        RateLimitService service = newService(failingRedis(), true);
        RateLimitResult result = service.check("problems-read", "ip", "1.2.3.4", 90, 60);
        assertTrue(result.allowed());
    }

    @Test
    void authPolicyAllowsWhenFailOpen() {
        RateLimitService service = newService(failingRedis(), false);
        RateLimitResult result = service.check("login", "ip", "1.2.3.4", 5, 60);
        assertTrue(result.allowed());
    }

    @Test
    void redisSuccessStillEnforcesLimit() {
        RateLimitService service = newService(countingRedis(5L), true);
        RateLimitResult result = service.check("login", "ip", "1.2.3.4", 5, 60);
        assertFalse(result.allowed());
    }

    private static RateLimitService newService(StringRedisTemplate redis, boolean failClosed) {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setEnabled(true);
        return new RateLimitService(properties, provider(redis), true, failClosed);
    }

    private static ObjectProvider<StringRedisTemplate> provider(StringRedisTemplate redis) {
        return new ObjectProvider<>() {
            @Override
            public StringRedisTemplate getObject() throws BeansException {
                return redis;
            }

            @Override
            public StringRedisTemplate getObject(Object... args) throws BeansException {
                return redis;
            }

            @Override
            public StringRedisTemplate getIfAvailable() {
                return redis;
            }

            @Override
            public StringRedisTemplate getIfUnique() {
                return redis;
            }
        };
    }

    private static StringRedisTemplate failingRedis() {
        return stubRedis(() -> {
            throw new RuntimeException("redis down");
        });
    }

    private static StringRedisTemplate countingRedis(long startBeforeIncrement) {
        AtomicLong count = new AtomicLong(startBeforeIncrement);
        return stubRedis(count::incrementAndGet);
    }

    @SuppressWarnings("unchecked")
    private static StringRedisTemplate stubRedis(Supplier<Long> increment) {
        ValueOperations<String, String> ops = (ValueOperations<String, String>) Proxy.newProxyInstance(
                ValueOperations.class.getClassLoader(),
                new Class<?>[] {ValueOperations.class},
                (proxy, method, args) -> {
                    if ("increment".equals(method.getName())) {
                        return increment.get();
                    }
                    if ("toString".equals(method.getName())) {
                        return "stub-value-ops";
                    }
                    if ("hashCode".equals(method.getName())) {
                        return System.identityHashCode(proxy);
                    }
                    if ("equals".equals(method.getName())) {
                        return proxy == args[0];
                    }
                    return null;
                });

        return new StringRedisTemplate() {
            @Override
            public ValueOperations<String, String> opsForValue() {
                return ops;
            }

            @Override
            public Boolean expire(String key, Duration timeout) {
                return true;
            }
        };
    }
}
