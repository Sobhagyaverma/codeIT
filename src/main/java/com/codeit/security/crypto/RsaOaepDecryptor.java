package com.codeit.security.crypto;

import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.security.spec.MGF1ParameterSpec;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RsaOaepDecryptor {

    private final RsaKeyService keyService;

    public RsaOaepDecryptor(RsaKeyService keyService) {
        this.keyService = keyService;
    }

    public String decrypt(String base64Ciphertext) {
        if (base64Ciphertext == null || base64Ciphertext.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing encrypted field");
        }
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(base64Ciphertext.trim());
            PrivateKey privateKey = keyService.getPrivateKey();
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaep = new OAEPParameterSpec(
                    "SHA-256",
                    "MGF1",
                    MGF1ParameterSpec.SHA256,
                    PSource.PSpecified.DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE, privateKey, oaep);
            byte[] plain = cipher.doFinal(cipherBytes);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid encrypted payload encoding");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to decrypt sensitive field");
        }
    }
}
