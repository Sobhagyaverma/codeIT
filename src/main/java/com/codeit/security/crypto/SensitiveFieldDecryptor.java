package com.codeit.security.crypto;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Resolves a sensitive field to plaintext: decrypt when RSA is enabled and the
 * client marked the request as encrypted; otherwise require plaintext.
 */
@Component
public class SensitiveFieldDecryptor {

    private final RsaKeyService keyService;
    private final RsaOaepDecryptor decryptor;

    public SensitiveFieldDecryptor(RsaKeyService keyService, RsaOaepDecryptor decryptor) {
        this.keyService = keyService;
        this.decryptor = decryptor;
    }

    /**
     * @param value      ciphertext (Base64) when encrypted=true, else plaintext
     * @param encrypted  client flag from the request body
     * @param fieldLabel for error messages
     */
    public String resolve(String value, boolean encrypted, String fieldLabel) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, fieldLabel + " is required");
        }
        if (keyService.isEnabled()) {
            if (!encrypted) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        fieldLabel + " must be RSA-encrypted (set encrypted=true)");
            }
            return decryptor.decrypt(value);
        }
        // RSA disabled — accept plaintext (local/dev fallback)
        if (encrypted) {
            // Still try decrypt if keys exist, so mixed clients work
            return decryptor.decrypt(value);
        }
        return value;
    }
}
