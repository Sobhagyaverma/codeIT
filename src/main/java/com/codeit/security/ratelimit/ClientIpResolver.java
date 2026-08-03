package com.codeit.security.ratelimit;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the real client IP.
 *
 * Behind a reverse proxy (Nginx, Cloudflare), the TCP peer is the proxy,
 * so we prefer the first address in X-Forwarded-For when present.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // "client, proxy1, proxy2" → take leftmost (original client)
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
