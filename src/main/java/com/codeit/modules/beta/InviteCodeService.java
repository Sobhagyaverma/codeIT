package com.codeit.modules.beta;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

import com.codeit.modules.registration.RegistrationProperties;

@Component
public class InviteCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HexFormat HEX = HexFormat.of();

    private final RegistrationProperties properties;

    public InviteCodeService(RegistrationProperties properties) {
        this.properties = properties;
    }

    /** CODEIT- + 32 hex chars (16 bytes). */
    public String generateRawCode() {
        byte[] bytes = new byte[16];
        RANDOM.nextBytes(bytes);
        return "CODEIT-" + HEX.formatHex(bytes);
    }

    public String hash(String rawCode) {
        String normalized = normalize(rawCode);
        String material = properties.getInvitePepper() + normalized;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(material.getBytes(StandardCharsets.UTF_8));
            return HEX.formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public String prefix(String rawCode) {
        String n = normalize(rawCode);
        return n.length() <= 12 ? n : n.substring(0, 12);
    }

    public String normalize(String rawCode) {
        return rawCode == null ? "" : rawCode.trim().toUpperCase();
    }
}
