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
 * Rate-limit public problem catalog reads (list / search / by id) by IP.
 * Stops scrapers without requiring login.
 */
public class ProblemsReadRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ProblemsReadRateLimitFilter.class);
    private static final String PREFIX = "/api/problems";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final RateLimitResponseWriter responseWriter;

    public ProblemsReadRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
        this.responseWriter = responseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.GET.matches(request.getMethod())) {
            return true;
        }
        String path = servletPath(request);
        return !path.equals(PREFIX) && !path.startsWith(PREFIX + "/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String ip = ClientIpResolver.resolve(request);
        var limit = properties.getProblemsRead();

        RateLimitResult result = rateLimitService.check(
                "problems-read",
                "ip",
                ip,
                limit.getLimit(),
                limit.getWindowSeconds());

        if (!result.allowed()) {
            log.warn("Problems read rate limit exceeded for ip={} key={}", ip, result.key());
            responseWriter.write(
                    response,
                    new RateLimitExceededException("problems-read", result.retryAfterSeconds()));
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));
        filterChain.doFilter(request, response);
    }

    private static String servletPath(HttpServletRequest request) {
        String servletPath = request.getServletPath();
        if (servletPath != null && !servletPath.isBlank()) {
            return servletPath;
        }
        return request.getRequestURI();
    }
}
