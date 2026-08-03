package com.codeit.security.ratelimit;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.codeit.modules.auth.AuthUserPrincipal;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Strict rate limit for admin mutating APIs (problem create, competition admin, user delete).
 * Must run after JwtAuthFilter so the admin user id is available.
 */
public class AdminWriteRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AdminWriteRateLimitFilter.class);

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final RateLimitResponseWriter responseWriter;

    public AdminWriteRateLimitFilter(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            RateLimitResponseWriter responseWriter) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
        this.responseWriter = responseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !isAdminWrite(request);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserPrincipal principal)) {
            // Not authenticated yet — let security return 401
            filterChain.doFilter(request, response);
            return;
        }

        var limit = properties.getAdminWrite();
        RateLimitResult result = rateLimitService.check(
                "admin-write",
                "user",
                String.valueOf(principal.getUserId()),
                limit.getLimit(),
                limit.getWindowSeconds());

        if (!result.allowed()) {
            log.warn(
                    "Admin write rate limit exceeded for userId={} path={} key={}",
                    principal.getUserId(),
                    servletPath(request),
                    result.key());
            responseWriter.write(
                    response,
                    new RateLimitExceededException("admin-write", result.retryAfterSeconds()));
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));
        filterChain.doFilter(request, response);
    }

    static boolean isAdminWrite(HttpServletRequest request) {
        String method = request.getMethod();
        if (method == null) {
            return false;
        }
        boolean write = HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
        if (!write) {
            return false;
        }

        String path = servletPath(request);

        // Register is public and has its own limiter
        if ("/api/user/register".equals(path)) {
            return false;
        }

        if (HttpMethod.POST.matches(method) && "/api/problems".equals(path)) {
            return true;
        }
        if ("/api/competitions/create".equals(path)) {
            return true;
        }
        if (path.startsWith("/api/competitions/addProblemsTo/")) {
            return true;
        }
        if (HttpMethod.PATCH.matches(method)
                && path.startsWith("/api/competitions/")
                && path.endsWith("/times")) {
            return true;
        }
        // Other /api/user/** writes (e.g. delete) — admin-only in SecurityConfig
        if (path.startsWith("/api/user/")) {
            return true;
        }
        return false;
    }

    private static String servletPath(HttpServletRequest request) {
        String servletPath = request.getServletPath();
        if (servletPath != null && !servletPath.isBlank()) {
            return servletPath;
        }
        return request.getRequestURI();
    }
}
