package com.codeit.security.ratelimit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers rate-limit configuration and auth filter beans.
 * Filters are wired into SecurityConfig (not as servlet @Components)
 * so each runs exactly once, before JWT auth.
 */
@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    @Bean
    public LoginRateLimitFilter loginRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        return new LoginRateLimitFilter(rateLimitService, properties, responseWriter);
    }

    @Bean
    public RegisterRateLimitFilter registerRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        return new RegisterRateLimitFilter(rateLimitService, properties, responseWriter);
    }

    @Bean
    public ProblemsReadRateLimitFilter problemsReadRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        return new ProblemsReadRateLimitFilter(rateLimitService, properties, responseWriter);
    }
}
