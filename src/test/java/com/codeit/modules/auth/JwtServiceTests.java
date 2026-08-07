package com.codeit.modules.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.codeit.modules.user.User;

class JwtServiceTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "1234567891011121314151617181920212223242526272829303132",
                86_400_000L);
    }

    @Test
    void sessionTokenIsNotSyncToken() {
        User user = new User();
        user.setId("1");
        user.setEmail("a@example.com");
        user.setRole("USER");
        user.setTokenVersion(0);

        String token = jwtService.generateToken(user);
        assertTrue(jwtService.isSessionToken(token));
        assertFalse(jwtService.isSyncToken(token));
    }

    @Test
    void syncTokenIsNotSessionToken() {
        String token = jwtService.generateSyncToken(
                1, "a@example.com", java.util.UUID.randomUUID(), "EDITOR", true);
        assertTrue(jwtService.isSyncToken(token));
        assertFalse(jwtService.isSessionToken(token));
    }

    @Test
    void syncTokenCarriesCanEditClaim() {
        String token = jwtService.generateSyncToken(
                1, "a@example.com", java.util.UUID.randomUUID(), "VIEWER", false);
        assertTrue(jwtService.isSyncToken(token));
        assertFalse(Boolean.TRUE.equals(jwtService.parseClaims(token).get("canEdit", Boolean.class)));
    }
}
