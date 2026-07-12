package com.codeit.modules.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AuthUserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserPrincipal principal)) {
            throw new IllegalStateException("No authenticated user");
        }
        return principal;
    }

    public static Integer currentUserId() {
        return currentUser().getUserId();
    }

    public static boolean isAdmin() {
        String role = currentUser().getRole();
        return role != null && role.equalsIgnoreCase("ADMIN");
    }
}