package com.codeit.modules.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.codeit.modules.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${codeit.jwt.secret}") String secret,
            @Value("${codeit.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Integer userId = Integer.parseInt(user.getId());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", user.getRole() != null ? user.getRole() : "USER");
        claims.put("tv", user.getTokenVersion() != null ? user.getTokenVersion() : 0);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public Integer extractUserId(String token) {
        Object value = parseClaims(token).get("userId");
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str) {
            return Integer.parseInt(str);
        }
        throw new IllegalArgumentException("userId claim missing");
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public int extractTokenVersion(String token) {
        Object value = parseClaims(token).get("tv");
        if (value == null) {
            return 0;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str) {
            return Integer.parseInt(str);
        }
        return 0;
    }

    /**
     * Yjs sync tokens are room-scoped and must never authenticate REST or STOMP sessions.
     */
    public boolean isSyncToken(String token) {
        try {
            String typ = parseClaims(token).get("typ", String.class);
            return "sync".equalsIgnoreCase(typ);
        } catch (Exception e) {
            return false;
        }
    }

    /** True when the JWT may be used as a login session (not a sync token). */
    public boolean isSessionToken(String token) {
        return isValid(token) && !isSyncToken(token);
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    /** Short-lived token for the Yjs sync-server (scoped to one room + edit capability). */
    public String generateSyncToken(
            Integer userId, String email, java.util.UUID roomId, String roomRole, boolean canEdit) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("typ", "sync");
        claims.put("roomId", roomId.toString());
        claims.put("userId", userId);
        claims.put("roomRole", roomRole != null ? roomRole : "VIEWER");
        claims.put("canEdit", canEdit);
        claims.put("jti", java.util.UUID.randomUUID().toString());

        long ttlMs = getSyncTokenTtlMs();
        Date now = new Date();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email != null ? email : String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + ttlMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long getSyncTokenTtlMs() {
        return 30 * 60 * 1000L;
    }
}