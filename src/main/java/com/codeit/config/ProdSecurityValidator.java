package com.codeit.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import jakarta.annotation.PostConstruct;

/**
 * Fail closed in production: refuse to boot with known-insecure defaults or missing
 * captcha keys.
 */
@Configuration
@Profile("prod")
public class ProdSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(ProdSecurityValidator.class);

    private static final String DEFAULT_JWT =
            "1234567891011121314151617181920212223242526272829303132";
    private static final String DEFAULT_OTP_PEPPER = "codeit-dev-otp-pepper-change-me";
    private static final String DEFAULT_DB_PASSWORD = "ROOT";

    @Value("${codeit.jwt.secret:}")
    private String jwtSecret;

    @Value("${codeit.otp.pepper:}")
    private String otpPepper;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${codeit.captcha.enabled:false}")
    private boolean captchaEnabled;

    @Value("${codeit.captcha.turnstile.site-key:}")
    private String turnstileSiteKey;

    @Value("${codeit.captcha.turnstile.secret-key:}")
    private String turnstileSecretKey;

    @PostConstruct
    void validate() {
        requireStrong("codeit.jwt.secret / CODEIT_JWT_SECRET", jwtSecret, DEFAULT_JWT, 32);
        requireStrong("codeit.otp.pepper / CODEIT_OTP_PEPPER", otpPepper, DEFAULT_OTP_PEPPER, 16);
        requireStrong(
                "spring.datasource.password / SPRING_DATASOURCE_PASSWORD",
                datasourcePassword,
                DEFAULT_DB_PASSWORD,
                8);

        if (!captchaEnabled) {
            fail("codeit.captcha.enabled must be true in the prod profile");
        }
        if (turnstileSiteKey == null || turnstileSiteKey.isBlank()) {
            fail("TURNSTILE_SITE_KEY is required when captcha is enabled in prod");
        }
        if (turnstileSecretKey == null || turnstileSecretKey.isBlank()) {
            fail("TURNSTILE_SECRET_KEY is required when captcha is enabled in prod");
        }

        log.info("Prod security checks passed (secrets present, captcha enabled)");
    }

    private static void requireStrong(String name, String value, String forbiddenDefault, int minLen) {
        if (value == null || value.isBlank()) {
            fail(name + " must be set in production");
        }
        if (value.equals(forbiddenDefault)) {
            fail(name + " must not use the built-in development default");
        }
        if (value.length() < minLen) {
            fail(name + " must be at least " + minLen + " characters");
        }
    }

    private static void fail(String message) {
        throw new IllegalStateException("PROD SECURITY: " + message);
    }
}
