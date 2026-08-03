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
 * Rate-limit POST /api/user/register by client IP.
 * Stops account-spam before UserService / DB work.
 */
public class RegisterRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RegisterRateLimitFilter.class);
    private static final String REGISTER_PATH = "/api/user/register";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final RateLimitResponseWriter responseWriter;

    public RegisterRateLimitFilter(
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
        return !(REGISTER_PATH.equals(servletPath) || REGISTER_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String ip = ClientIpResolver.resolve(request);
        var register = properties.getRegister();

        RateLimitResult result = rateLimitService.check(
                "register",
                "ip",
                ip,
                register.getLimit(),
                register.getWindowSeconds());

        if (!result.allowed()) {
            log.warn("Register rate limit exceeded for ip={} key={}", ip, result.key());
            responseWriter.write(
                    response,
                    new RateLimitExceededException("register", result.retryAfterSeconds()));
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));

        filterChain.doFilter(request, response);
    }
}
