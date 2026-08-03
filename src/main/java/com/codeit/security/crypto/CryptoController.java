package com.codeit.security.crypto;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crypto")
public class CryptoController {

    private final RsaKeyService keyService;

    public CryptoController(RsaKeyService keyService) {
        this.keyService = keyService;
    }

    @GetMapping("/public-key")
    public PublicKeyResponse publicKey() {
        return new PublicKeyResponse(
                keyService.getKeyId(),
                keyService.getAlgorithm(),
                keyService.getPublicKeyPem(),
                keyService.isEnabled());
    }
}
