package com.codeit.security.ratelimit;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Step 1: rate-limit POST /api/auth/login by client IP.
 *
 * Registered in SecurityConfig before JwtAuthFilter so brute-force
 * attempts never reach AuthService / DB work.
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);
    private static final String LOGIN_PATH = "/api/auth/login";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final RateLimitResponseWriter responseWriter;

    public LoginRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
        this.responseWriter = responseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        String servletPath = request.getServletPath();
        return !(LOGIN_PATH.equals(servletPath) || LOGIN_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String ip = ClientIpResolver.resolve(request);
        var login = properties.getLogin();

        RateLimitResult result = rateLimitService.check(
                "login",
                "ip",
                ip,
                login.getLimit(),
                login.getWindowSeconds());

        if (!result.allowed()) {
            log.warn("Login rate limit exceeded for ip={} key={}", ip, result.key());
            responseWriter.write(
                    response,
                    new RateLimitExceededException("login", result.retryAfterSeconds()));
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));

        filterChain.doFilter(request, response);
    }
}
