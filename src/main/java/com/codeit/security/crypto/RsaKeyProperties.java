package com.codeit.security.crypto;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "codeit.crypto.rsa")
public class RsaKeyProperties {

    /** Master switch. When false, plaintext passwords are accepted. */
    private boolean enabled = true;

    /**
     * Path to a PEM file containing the PKCS#8 private key.
     * If missing and generate-if-missing=true, a new keypair is written here.
     */
    private String privateKeyPath = "data/codeit-rsa-private.pem";

    /** When true, generate and persist a keypair if privateKeyPath is absent. */
    private boolean generateIfMissing = true;

    private int keySize = 2048;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPrivateKeyPath() {
        return privateKeyPath;
    }

    public void setPrivateKeyPath(String privateKeyPath) {
        this.privateKeyPath = privateKeyPath;
    }

    public boolean isGenerateIfMissing() {
        return generateIfMissing;
    }

    public void setGenerateIfMissing(boolean generateIfMissing) {
        this.generateIfMissing = generateIfMissing;
    }

    public int getKeySize() {
        return keySize;
    }

    public void setKeySize(int keySize) {
        this.keySize = keySize;
    }
}
