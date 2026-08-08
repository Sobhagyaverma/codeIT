package com.codeit.modules.contact;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.AuthUserPrincipal;
import com.codeit.modules.contact.dto.ContactRequest;
import com.codeit.modules.mail.MailService;
import com.codeit.modules.mail.MailTemplateRenderer;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.security.captcha.TurnstileService;
import com.codeit.security.ratelimit.ClientIpResolver;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);
    private static final DateTimeFormatter TS =
            DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    private final ContactMessageRepository repository;
    private final MailService mailService;
    private final MailTemplateRenderer templates;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;
    private final TurnstileService turnstileService;

    public ContactService(
            ContactMessageRepository repository,
            MailService mailService,
            MailTemplateRenderer templates,
            UserRepository userRepository,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties,
            TurnstileService turnstileService) {
        this.repository = repository;
        this.mailService = mailService;
        this.templates = templates;
        this.userRepository = userRepository;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
        this.turnstileService = turnstileService;
    }

    public Map<String, Object> submit(ContactRequest request, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ip);
        Integer authUserId = currentUserId();
        String rateKey = authUserId != null ? "user:" + authUserId : "ip:" + ip;
        rateLimitService.checkTieredOrThrow(
                "contact", rateKey, rateLimitProperties.getContact());

        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        String subject = request.getSubject().trim();
        String message = request.getMessage().trim();
        String ua = http.getHeader("User-Agent");
        if (ua != null && ua.length() > 512) {
            ua = ua.substring(0, 512);
        }

        Integer userId = authUserId;
        if (userId != null) {
            User u = userRepository.getUserById(userId).orElse(null);
            if (u != null && u.getEmail() != null && !u.getEmail().isBlank()) {
                email = u.getEmail().trim().toLowerCase();
            }
        }

        long id = repository.insert(
                username, userId, email, subject, message, "PENDING", ip, ua);

        try {
            deliver(id);
        } catch (Exception ex) {
            log.warn("Contact initial send failed id={}: {}", id, ex.toString());
        }

        return Map.of(
                "message",
                "Your feedback is our priority — we'll work on it as soon as possible.",
                "id", id);
    }

    void deliver(long id) {
        ContactMessage msg = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        String inbox = mailService.getInbox();
        if (inbox == null || inbox.isBlank()) {
            repository.markFailed(id, "Mail inbox not configured (codeit.mail.inbox)");
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_TEMPORARILY_UNAVAILABLE");
        }

        String html = templates.render(
                "contact-notify.html",
                Map.of(
                        "messageId", String.valueOf(msg.getId()),
                        "username", nullToDash(msg.getUsername()),
                        "userId", msg.getUserId() == null ? "guest" : String.valueOf(msg.getUserId()),
                        "userEmail", nullToDash(msg.getUserEmail()),
                        "timestamp",
                        msg.getCreatedAt() == null ? "-" : TS.format(msg.getCreatedAt()),
                        "clientIp", nullToDash(msg.getClientIp()),
                        "userAgent", nullToDash(msg.getUserAgent()),
                        "subject", nullToDash(msg.getSubject()),
                        "message", nullToDash(msg.getMessage())));

        try {
            mailService.sendHtml(inbox, "[CodeT Contact] " + msg.getSubject(), html);
            repository.markSent(id);
        } catch (RuntimeException ex) {
            repository.markFailed(id, ex.getMessage());
            throw ex;
        }
    }

    public void retryFailed() {
        for (ContactMessage msg : repository.findFailedForRetry(3, 60, 20)) {
            try {
                deliver(msg.getId());
            } catch (Exception ex) {
                log.debug("Contact retry failed id={}: {}", msg.getId(), ex.toString());
            }
        }
    }

    private Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserPrincipal principal)) {
            return null;
        }
        return principal.getUserId();
    }

    private static String nullToDash(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }
}
