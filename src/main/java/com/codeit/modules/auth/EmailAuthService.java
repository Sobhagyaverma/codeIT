package com.codeit.modules.auth;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.dto.EmailOnlyRequest;
import com.codeit.modules.auth.dto.ForgotPasswordResetRequest;
import com.codeit.modules.auth.dto.ForgotPasswordVerifyRequest;
import com.codeit.modules.auth.dto.VerifyEmailRequest;
import com.codeit.modules.mail.MailService;
import com.codeit.modules.mail.MailTemplateRenderer;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.security.crypto.SensitiveFieldDecryptor;
import com.codeit.security.otp.OtpProperties;
import com.codeit.security.otp.OtpService;
import com.codeit.security.captcha.TurnstileService;
import com.codeit.security.ratelimit.ClientIpResolver;
import com.codeit.security.ratelimit.DualKeyTieredRateLimiter;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class EmailAuthService {

    private static final Logger log = LoggerFactory.getLogger(EmailAuthService.class);
    private static final String GENERIC_FORGOT_MSG =
            "If an account exists for that email, we sent a verification code.";

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final OtpProperties otpProperties;
    private final MailService mailService;
    private final MailTemplateRenderer templates;
    private final PasswordEncoder passwordEncoder;
    private final SensitiveFieldDecryptor sensitiveFieldDecryptor;
    private final DualKeyTieredRateLimiter dualKeyTieredRateLimiter;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;
    private final TurnstileService turnstileService;

    public EmailAuthService(
            UserRepository userRepository,
            OtpService otpService,
            OtpProperties otpProperties,
            MailService mailService,
            MailTemplateRenderer templates,
            PasswordEncoder passwordEncoder,
            SensitiveFieldDecryptor sensitiveFieldDecryptor,
            DualKeyTieredRateLimiter dualKeyTieredRateLimiter,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties,
            TurnstileService turnstileService) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.otpProperties = otpProperties;
        this.mailService = mailService;
        this.templates = templates;
        this.passwordEncoder = passwordEncoder;
        this.sensitiveFieldDecryptor = sensitiveFieldDecryptor;
        this.dualKeyTieredRateLimiter = dualKeyTieredRateLimiter;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
        this.turnstileService = turnstileService;
    }

    public void sendVerificationEmail(User user) {
        String email = user.getEmail();
        String otp = otpService.issue(OtpService.Purpose.VERIFY, email);
        String html = templates.render(
                "verify-otp.html",
                Map.of(
                        "otp", otp,
                        "ttlMinutes", String.valueOf(Math.max(1, otpProperties.getTtlSeconds() / 60))));
        try {
            mailService.sendHtml(email, "Verify your CodeT email", html);
        } catch (RuntimeException ex) {
            otpService.invalidate(OtpService.Purpose.VERIFY, email);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_TEMPORARILY_UNAVAILABLE");
        }
        log.info("Verification OTP issued userId={}", user.getId());
    }

    public Map<String, Object> verifyEmail(VerifyEmailRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        String email = OtpService.normalizeEmail(request.getEmail());
        dualKeyTieredRateLimiter.checkEmailAndIpOrThrow(
                "verify-email", email, ip, rateLimitProperties.getVerifyEmail());

        User user = userRepository.getUserByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return Map.of("message", "Email already verified", "verified", true);
        }
        boolean ok = otpService.verify(OtpService.Purpose.VERIFY, email, request.getOtp());
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        userRepository.setEmailVerified(Integer.parseInt(user.getId()), true);
        return Map.of("message", "Email verified", "verified", true);
    }

    public Map<String, Object> resendVerification(EmailOnlyRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        String email = OtpService.normalizeEmail(request.getEmail());
        dualKeyTieredRateLimiter.checkEmailAndIpOrThrow(
                "verify-email-resend", email, ip, rateLimitProperties.getVerifyEmailResend());

        User user = userRepository.getUserByEmail(email);
        if (user == null) {
            // Avoid enumeration — same shape as success
            return Map.of("message", "If an account exists, a new code was sent.");
        }
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return Map.of("message", "Email already verified", "verified", true);
        }
        sendVerificationEmail(user);
        return Map.of("message", "If an account exists, a new code was sent.");
    }

    public Map<String, Object> forgotPassword(EmailOnlyRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        String email = OtpService.normalizeEmail(request.getEmail());
        dualKeyTieredRateLimiter.checkEmailAndIpOrThrow(
                "forgot-password", email, ip, rateLimitProperties.getForgotPassword());

        User user = userRepository.getUserByEmail(email);
        if (user != null) {
            try {
                String otp = otpService.issue(OtpService.Purpose.FORGOT, email);
                String html = templates.render(
                        "forgot-otp.html",
                        Map.of(
                                "otp", otp,
                                "ttlMinutes",
                                String.valueOf(Math.max(1, otpProperties.getTtlSeconds() / 60))));
                mailService.sendHtml(email, "Reset your CodeT password", html);
                log.info("Forgot-password OTP issued userId={}", user.getId());
            } catch (ResponseStatusException ex) {
                if (ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    throw ex;
                }
                log.warn("Forgot-password send skipped: {}", ex.getReason());
            } catch (RuntimeException ex) {
                log.warn("Forgot-password mail failed: {}", ex.toString());
            }
        }
        return Map.of("message", GENERIC_FORGOT_MSG);
    }

    public Map<String, Object> verifyForgotOtp(
            ForgotPasswordVerifyRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        String email = OtpService.normalizeEmail(request.getEmail());
        dualKeyTieredRateLimiter.checkEmailAndIpOrThrow(
                "forgot-password-verify", email, ip, rateLimitProperties.getForgotPasswordVerify());

        User user = userRepository.getUserByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        boolean ok = otpService.verify(OtpService.Purpose.FORGOT, email, request.getOtp());
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        String resetToken = otpService.createResetToken(Integer.parseInt(user.getId()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "OTP verified");
        body.put("resetToken", resetToken);
        body.put("expiresInSeconds", otpProperties.getResetTokenTtlSeconds());
        return body;
    }

    public Map<String, Object> resetPassword(
            ForgotPasswordResetRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        String tokenKey = request.getResetToken() == null ? "unknown" : request.getResetToken().trim();
        rateLimitService.checkTieredOrThrow(
                "forgot-password-reset",
                ip + ":" + tokenKey,
                rateLimitProperties.getForgotPasswordReset());

        Integer userId = otpService.peekResetTokenUserId(request.getResetToken());
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        String newPassword = sensitiveFieldDecryptor.resolve(
                request.getNewPassword(), request.isEncrypted(), "newPassword");
        if (newPassword.length() < 6) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }

        userId = otpService.consumeResetToken(request.getResetToken());
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        String hash = passwordEncoder.encode(newPassword);
        int updated = userRepository.updatePasswordAndBumpTokenVersion(userId, hash);
        if (updated <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to reset password");
        }
        return Map.of("message", "Password updated. Please sign in again.");
    }
}
