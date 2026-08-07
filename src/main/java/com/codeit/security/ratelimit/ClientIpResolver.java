package com.codeit.security.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the real client IP for rate limits and captcha.
 *
 * <p>By default ({@code codeit.security.trust-forwarded-headers=false}) only
 * {@link HttpServletRequest#getRemoteAddr()} is used so clients cannot spoof
 * {@code X-Forwarded-For}. Enable trust only behind Nginx/Cloudflare that
 * <em>sets</em> {@code X-Real-IP} / {@code X-Forwarded-For} and strips inbound spoofing.
 */
@Component
public class ClientIpResolver {

    private static volatile boolean trustForwardedHeaders;

    @Value("${codeit.security.trust-forwarded-headers:false}")
    private boolean trustForwardedHeadersProp;

    @PostConstruct
    void init() {
        trustForwardedHeaders = trustForwardedHeadersProp;
    }

    /** Package-visible for tests. */
    static void setTrustForwardedHeadersForTests(boolean trust) {
        trustForwardedHeaders = trust;
    }

    public static String resolve(HttpServletRequest request) {
        if (trustForwardedHeaders) {
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // Nginx that sets X-Forwarded-For $remote_addr → single client hop first.
                // If the chain is "client, proxy1, proxy2", leftmost is the original client
                // only when the edge proxy replaced (not appended) untrusted client input.
                String first = forwarded.split(",")[0].trim();
                if (!first.isEmpty()) {
                    return first;
                }
            }
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
