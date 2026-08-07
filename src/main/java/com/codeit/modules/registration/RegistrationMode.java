package com.codeit.modules.registration;

/**
 * Registration gate modes. COLLEGE_ONLY is an alias of INVITE_ONLY (no domain logic).
 */
public enum RegistrationMode {
    OPEN,
    INVITE_ONLY,
    COLLEGE_ONLY;

    public boolean requiresInvite() {
        return this == INVITE_ONLY || this == COLLEGE_ONLY;
    }

    public boolean isPrivateBeta() {
        return requiresInvite();
    }

    public static RegistrationMode from(String raw) {
        if (raw == null || raw.isBlank()) {
            return INVITE_ONLY;
        }
        try {
            return RegistrationMode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return INVITE_ONLY;
        }
    }
}
