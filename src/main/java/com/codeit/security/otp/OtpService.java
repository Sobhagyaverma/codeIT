package com.codeit.security.otp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Redis-backed hashed OTP store. Fail-closed when Redis is unavailable.
 */
@Service
@EnableConfigurationProperties(OtpProperties.class)
public class OtpService {

    public enum Purpose {
        VERIFY("otp:verify:"),
        FORGOT("otp:forgot:");

        private final String prefix;

        Purpose(String prefix) {
            this.prefix = prefix;
        }

        String otpKey(String emailNorm) {
            return prefix + emailNorm;
        }

        String cooldownKey(String emailNorm) {
            return prefix + "cooldown:" + emailNorm;
        }
    }

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpProperties properties;
    private final StringRedisTemplate redis;
    private final boolean redisEnabled;
    private final ObjectMapper objectMapper;

    public OtpService(
            OtpProperties properties,
            ObjectProvider<StringRedisTemplate> redisProvider,
            @Value("${codeit.redis.enabled:false}") boolean redisEnabled,
            ObjectMapper objectMapper) {
        this.properties = properties;
        this.redis = redisProvider.getIfAvailable();
        this.redisEnabled = redisEnabled && this.redis != null;
        this.objectMapper = objectMapper;
    }

    /** Generate a new 6-digit OTP, store hash, set cooldown. Returns plaintext OTP once. */
    public String issue(Purpose purpose, String email) {
        requireRedis();
        String emailNorm = normalizeEmail(email);
        String cooldownKey = purpose.cooldownKey(emailNorm);
        Boolean cooling = redis.hasKey(cooldownKey);
        if (Boolean.TRUE.equals(cooling)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait before requesting another code");
        }

        String otp = generateSixDigit();
        String hash = hashOtp(otp);
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("hash", hash);
        payload.put("attempts", 0);

        String otpKey = purpose.otpKey(emailNorm);
        try {
            redis.delete(otpKey);
            redis.opsForValue().set(
                    otpKey,
                    objectMapper.writeValueAsString(payload),
                    Duration.ofSeconds(properties.getTtlSeconds()));
            redis.opsForValue().set(
                    cooldownKey,
                    "1",
                    Duration.ofSeconds(properties.getCooldownSeconds()));
        } catch (Exception ex) {
            log.error("OTP store failed for purpose={}", purpose, ex);
            throw unavailable();
        }
        return otp;
    }

    /**
     * Verify OTP. On success deletes the key. On max attempts burns the key.
     *
     * @return true if valid
     */
    public boolean verify(Purpose purpose, String email, String otp) {
        requireRedis();
        String emailNorm = normalizeEmail(email);
        String otpKey = purpose.otpKey(emailNorm);
        try {
            String raw = redis.opsForValue().get(otpKey);
            if (raw == null || raw.isBlank()) {
                return false;
            }
            JsonNode node = objectMapper.readTree(raw);
            String storedHash = node.path("hash").asText(null);
            int attempts = node.path("attempts").asInt(0);
            if (storedHash == null) {
                redis.delete(otpKey);
                return false;
            }
            if (attempts >= properties.getMaxAttempts()) {
                redis.delete(otpKey);
                return false;
            }

            boolean ok = MessageDigest.isEqual(
                    storedHash.getBytes(StandardCharsets.UTF_8),
                    hashOtp(otp == null ? "" : otp.trim()).getBytes(StandardCharsets.UTF_8));

            if (ok) {
                redis.delete(otpKey);
                return true;
            }

            attempts += 1;
            if (attempts >= properties.getMaxAttempts()) {
                redis.delete(otpKey);
                return false;
            }
            ObjectNode updated = objectMapper.createObjectNode();
            updated.put("hash", storedHash);
            updated.put("attempts", attempts);
            Long ttl = redis.getExpire(otpKey);
            if (ttl != null && ttl > 0) {
                redis.opsForValue().set(otpKey, objectMapper.writeValueAsString(updated), Duration.ofSeconds(ttl));
            } else {
                redis.delete(otpKey);
            }
            return false;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OTP verify failed for purpose={}", purpose, ex);
            throw unavailable();
        }
    }

    public void invalidate(Purpose purpose, String email) {
        if (!redisEnabled) {
            return;
        }
        try {
            redis.delete(purpose.otpKey(normalizeEmail(email)));
        } catch (Exception ex) {
            log.warn("OTP invalidate failed: {}", ex.toString());
        }
    }

    public String createResetToken(int userId) {
        requireRedis();
        String token = UUID.randomUUID().toString().replace("-", "");
        String key = "otp:forgot:reset:" + token;
        try {
            redis.opsForValue().set(
                    key,
                    String.valueOf(userId),
                    Duration.ofSeconds(properties.getResetTokenTtlSeconds()));
            return token;
        } catch (Exception ex) {
            log.error("Reset token store failed", ex);
            throw unavailable();
        }
    }

    /** Peek user id for reset token without consuming. */
    public Integer peekResetTokenUserId(String token) {
        requireRedis();
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            String val = redis.opsForValue().get("otp:forgot:reset:" + token.trim());
            if (val == null || val.isBlank()) {
                return null;
            }
            return Integer.parseInt(val);
        } catch (Exception ex) {
            log.error("Reset token peek failed", ex);
            throw unavailable();
        }
    }

    public Integer consumeResetToken(String token) {
        requireRedis();
        if (token == null || token.isBlank()) {
            return null;
        }
        String key = "otp:forgot:reset:" + token.trim();
        try {
            String val = redis.opsForValue().get(key);
            if (val == null || val.isBlank()) {
                return null;
            }
            redis.delete(key);
            return Integer.parseInt(val);
        } catch (Exception ex) {
            log.error("Reset token consume failed", ex);
            throw unavailable();
        }
    }

    public static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase();
    }

    private void requireRedis() {
        if (!redisEnabled) {
            throw unavailable();
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "EMAIL_TEMPORARILY_UNAVAILABLE");
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest((otp + properties.getPepper()).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException("OTP hash failed", ex);
        }
    }

    private static String generateSixDigit() {
        int n = RANDOM.nextInt(1_000_000);
        return String.format("%06d", n);
    }
}
