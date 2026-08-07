package com.codeit.modules.beta;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.admin.AdminAuditService;
import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.beta.dto.BetaAccessRequestDto;
import com.codeit.modules.beta.dto.GenerateInviteRequest;
import com.codeit.modules.beta.dto.RejectRequestDto;
import com.codeit.modules.beta.dto.VerifyInviteRequest;
import com.codeit.modules.mail.MailService;
import com.codeit.modules.mail.MailTemplateRenderer;
import com.codeit.modules.registration.RegistrationProperties;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.security.captcha.TurnstileService;
import com.codeit.security.ratelimit.ClientIpResolver;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class BetaService {

    private static final DateTimeFormatter EXPIRY_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'").withZone(ZoneOffset.UTC);

    private final BetaAccessRequestRepository requestRepository;
    private final BetaInviteRepository inviteRepository;
    private final InviteCodeService inviteCodeService;
    private final RegistrationProperties registrationProperties;
    private final MailService mailService;
    private final MailTemplateRenderer templates;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;
    private final TurnstileService turnstileService;
    private final AdminAuditService adminAuditService;

    public BetaService(
            BetaAccessRequestRepository requestRepository,
            BetaInviteRepository inviteRepository,
            InviteCodeService inviteCodeService,
            RegistrationProperties registrationProperties,
            MailService mailService,
            MailTemplateRenderer templates,
            UserRepository userRepository,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties,
            TurnstileService turnstileService,
            AdminAuditService adminAuditService) {
        this.requestRepository = requestRepository;
        this.inviteRepository = inviteRepository;
        this.inviteCodeService = inviteCodeService;
        this.registrationProperties = registrationProperties;
        this.mailService = mailService;
        this.templates = templates;
        this.userRepository = userRepository;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
        this.turnstileService = turnstileService;
        this.adminAuditService = adminAuditService;
    }

    public Map<String, Object> requestAccess(BetaAccessRequestDto dto, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        turnstileService.verifyOrThrow(dto.getCaptchaToken(), ip);
        rateLimitService.checkOrThrow(
                "beta-request",
                "ip",
                ip,
                rateLimitProperties.getBetaRequest().getLimit(),
                rateLimitProperties.getBetaRequest().getWindowSeconds());

        String email = dto.getEmail().trim().toLowerCase();
        if (userRepository.getUserByEmail(email) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (requestRepository.hasPending(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending request");
        }

        String reason = dto.getReason() == null || dto.getReason().isBlank() ? null : dto.getReason().trim();
        try {
            long id = requestRepository.insert(
                    dto.getFullName().trim(),
                    email,
                    dto.getCollege().trim(),
                    dto.getYear().trim(),
                    reason);
            return Map.of(
                    "id", id,
                    "status", "PENDING",
                    "message", "Thanks — we received your beta access request.");
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending request");
        }
    }

    public Map<String, Object> verifyInvite(VerifyInviteRequest dto, HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        rateLimitService.checkOrThrow(
                "beta-verify-invite",
                "ip",
                ip,
                rateLimitProperties.getBetaVerifyInvite().getLimit(),
                rateLimitProperties.getBetaVerifyInvite().getWindowSeconds());

        BetaInvite invite = requireValidInvite(dto.getInviteCode(), dto.getEmail());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("valid", true);
        body.put("email", invite.getEmail());
        body.put("expiresAt", invite.getExpiresAt() != null ? invite.getExpiresAt().toString() : null);
        return body;
    }

    /**
     * Validates invite for registration. Does not consume.
     * Caller must {@link #consumeInvite} after user create.
     */
    public BetaInvite requireValidInvite(String rawCode, String email) {
        if (!registrationProperties.requiresInvite()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invites are not required in OPEN mode");
        }
        if (rawCode == null || rawCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite code is required");
        }
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        inviteRepository.expireStale();
        String hash = inviteCodeService.hash(rawCode);
        BetaInvite invite = inviteRepository
                .findByHash(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid invite code"));

        if (!"ACTIVE".equals(invite.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite is no longer valid");
        }
        if (invite.getExpiresAt() == null || !invite.getExpiresAt().isAfter(Instant.now())) {
            inviteRepository.expireStale();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite has expired");
        }
        if (!normalizedEmail.equalsIgnoreCase(invite.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invite email does not match registration email");
        }
        return invite;
    }

    @Transactional
    public void consumeInvite(long inviteId, int userId) {
        int updated = inviteRepository.markUsed(inviteId, userId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invite was already used or expired");
        }
    }

    public List<Map<String, Object>> listRequests(String status) {
        return requestRepository.list(status, 100).stream().map(this::toRequestMap).toList();
    }

    @Transactional
    public Map<String, Object> approveRequest(long requestId, HttpServletRequest http) {
        int adminId = SecurityUtils.currentUserId();
        String ip = ClientIpResolver.resolve(http);
        BetaAccessRequest req = requestRepository
                .findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"PENDING".equals(req.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        int updated = requestRepository.markApproved(requestId, adminId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }

        IssuedInvite issued = createAndEmailInvite(
                req.getEmail(), req.getFullName(), requestId, adminId);

        adminAuditService.log(
                adminId,
                "BETA_REQUEST_APPROVE",
                "beta_access_request",
                String.valueOf(requestId),
                "email=" + req.getEmail() + " inviteId=" + issued.inviteId(),
                ip,
                true);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("requestId", requestId);
        body.put("status", "APPROVED");
        body.put("inviteId", issued.inviteId());
        body.put("inviteCode", issued.rawCode());
        body.put("expiresAt", issued.expiresAt().toString());
        body.put("emailSent", issued.emailSent());
        return body;
    }

    @Transactional
    public Map<String, Object> rejectRequest(long requestId, RejectRequestDto dto, HttpServletRequest http) {
        int adminId = SecurityUtils.currentUserId();
        String ip = ClientIpResolver.resolve(http);
        String reason = dto == null || dto.getReason() == null ? null : dto.getReason().trim();
        int updated = requestRepository.markRejected(requestId, adminId, reason);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        adminAuditService.log(
                adminId,
                "BETA_REQUEST_REJECT",
                "beta_access_request",
                String.valueOf(requestId),
                reason,
                ip,
                true);
        return Map.of("requestId", requestId, "status", "REJECTED");
    }

    @Transactional
    public Map<String, Object> generateInvite(GenerateInviteRequest dto, HttpServletRequest http) {
        int adminId = SecurityUtils.currentUserId();
        String ip = ClientIpResolver.resolve(http);
        String email = dto.getEmail().trim().toLowerCase();
        if (userRepository.getUserByEmail(email) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already registered");
        }
        String name = dto.getFullName() == null || dto.getFullName().isBlank() ? "there" : dto.getFullName().trim();
        IssuedInvite issued = createAndEmailInvite(email, name, null, adminId);
        adminAuditService.log(
                adminId,
                "BETA_INVITE_GENERATE",
                "beta_invite",
                String.valueOf(issued.inviteId()),
                "email=" + email,
                ip,
                true);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("inviteId", issued.inviteId());
        body.put("inviteCode", issued.rawCode());
        body.put("email", email);
        body.put("expiresAt", issued.expiresAt().toString());
        body.put("emailSent", issued.emailSent());
        return body;
    }

    public List<Map<String, Object>> listInvites() {
        inviteRepository.expireStale();
        return inviteRepository.list(100).stream().map(this::toInviteMap).toList();
    }

    @Transactional
    public Map<String, Object> resendInvite(long inviteId, HttpServletRequest http) {
        int adminId = SecurityUtils.currentUserId();
        String ip = ClientIpResolver.resolve(http);
        BetaInvite existing = inviteRepository
                .findById(inviteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));

        rateLimitService.checkOrThrow(
                "beta-invite-resend",
                "email",
                existing.getEmail().toLowerCase(),
                rateLimitProperties.getBetaInviteResend().getLimit(),
                rateLimitProperties.getBetaInviteResend().getWindowSeconds());

        if ("USED".equals(existing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invite already used");
        }
        inviteRepository.revoke(inviteId);

        String name = existing.getEmail();
        User u = userRepository.getUserByEmail(existing.getEmail());
        if (u != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already registered");
        }

        IssuedInvite issued = createAndEmailInvite(
                existing.getEmail(), name, existing.getRequestId(), adminId);

        adminAuditService.log(
                adminId,
                "BETA_INVITE_RESEND",
                "beta_invite",
                String.valueOf(issued.inviteId()),
                "revoked=" + inviteId + " email=" + existing.getEmail(),
                ip,
                true);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("inviteId", issued.inviteId());
        body.put("inviteCode", issued.rawCode());
        body.put("email", existing.getEmail());
        body.put("expiresAt", issued.expiresAt().toString());
        body.put("emailSent", issued.emailSent());
        return body;
    }

    public Map<String, Object> analytics() {
        inviteRepository.expireStale();
        Map<String, Object> raw = inviteRepository.analyticsBundle();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("registeredUsers", number(raw.get("registered_users")));
        body.put("pendingRequests", number(raw.get("pending_requests")));
        body.put("approvedRequests", number(raw.get("approved_requests")));
        body.put("rejectedRequests", number(raw.get("rejected_requests")));
        body.put("activeInvites", number(raw.get("active_invites")));
        body.put("usedInvites", number(raw.get("used_invites")));
        body.put("expiredInvites", number(raw.get("expired_invites")));
        body.put("dailyActiveUsers", number(raw.get("dau_submissions")));
        body.put("problemsSolved", number(raw.get("accepted_submissions")));
        body.put("quickClashCount", number(raw.get("quick_clash_count")));
        body.put("competitionCount", number(raw.get("competition_count")));
        body.put("codeRoomsCreated", number(raw.get("rooms_created")));
        body.put("aiRequests", number(raw.get("ai_requests")));
        return body;
    }

    private IssuedInvite createAndEmailInvite(
            String email, String fullName, Long requestId, Integer adminId) {
        String raw = inviteCodeService.generateRawCode();
        String hash = inviteCodeService.hash(raw);
        Instant expiresAt = Instant.now().plus(registrationProperties.getInviteTtlDays(), ChronoUnit.DAYS);
        long inviteId = inviteRepository.insert(
                hash,
                inviteCodeService.prefix(raw),
                email.toLowerCase(),
                requestId,
                expiresAt,
                adminId);

        boolean emailSent = sendInviteEmail(email, fullName, raw, expiresAt);
        return new IssuedInvite(inviteId, raw, expiresAt, emailSent);
    }

    private boolean sendInviteEmail(String email, String name, String rawCode, Instant expiresAt) {
        String registerUrl = registrationProperties.getPublicBaseUrl()
                + "/register?invite="
                + URLEncoder.encode(rawCode, StandardCharsets.UTF_8)
                + "&email="
                + URLEncoder.encode(email, StandardCharsets.UTF_8);
        try {
            String html = templates.render(
                    "beta-invite.html",
                    Map.of(
                            "name", name == null || name.isBlank() ? "there" : name,
                            "email", email,
                            "inviteCode", rawCode,
                            "expiresAt", EXPIRY_FMT.format(expiresAt),
                            "registerUrl", registerUrl));
            mailService.sendHtml(email, "Your CodeIT Private Beta invite", html);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private Map<String, Object> toRequestMap(BetaAccessRequest r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("fullName", r.getFullName());
        m.put("email", r.getEmail());
        m.put("college", r.getCollege());
        m.put("year", r.getYear());
        m.put("reason", r.getReason());
        m.put("status", r.getStatus());
        m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
        m.put("reviewedAt", r.getReviewedAt() != null ? r.getReviewedAt().toString() : null);
        m.put("rejectReason", r.getRejectReason());
        return m;
    }

    private Map<String, Object> toInviteMap(BetaInvite inv) {
        String status = inv.getStatus();
        if ("ACTIVE".equals(status)
                && inv.getExpiresAt() != null
                && !inv.getExpiresAt().isAfter(Instant.now())) {
            status = "EXPIRED";
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", inv.getId());
        m.put("codePrefix", inv.getCodePrefix());
        m.put("email", inv.getEmail());
        m.put("requestId", inv.getRequestId());
        m.put("status", status);
        m.put("expiresAt", inv.getExpiresAt() != null ? inv.getExpiresAt().toString() : null);
        m.put("createdAt", inv.getCreatedAt() != null ? inv.getCreatedAt().toString() : null);
        m.put("usedAt", inv.getUsedAt() != null ? inv.getUsedAt().toString() : null);
        return m;
    }

    private static long number(Object o) {
        if (o instanceof Number n) {
            return n.longValue();
        }
        return 0L;
    }

    private record IssuedInvite(long inviteId, String rawCode, Instant expiresAt, boolean emailSent) {}
}
