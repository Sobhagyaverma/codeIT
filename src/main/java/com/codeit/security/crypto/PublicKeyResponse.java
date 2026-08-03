package com.codeit.security.crypto;

public class PublicKeyResponse {

    private String keyId;
    private String algorithm;
    private String publicKeyPem;
    private boolean enabled;

    public PublicKeyResponse() {
    }

    public PublicKeyResponse(String keyId, String algorithm, String publicKeyPem, boolean enabled) {
        this.keyId = keyId;
        this.algorithm = algorithm;
        this.publicKeyPem = publicKeyPem;
        this.enabled = enabled;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public String getPublicKeyPem() {
        return publicKeyPem;
    }

    public void setPublicKeyPem(String publicKeyPem) {
        this.publicKeyPem = publicKeyPem;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
