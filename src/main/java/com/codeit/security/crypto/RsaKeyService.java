package com.codeit.security.crypto;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
@EnableConfigurationProperties(RsaKeyProperties.class)
public class RsaKeyService {

    private static final Logger log = LoggerFactory.getLogger(RsaKeyService.class);
    public static final String ALGORITHM = "RSA-OAEP-SHA256";

    private final RsaKeyProperties properties;
    private PrivateKey privateKey;
    private PublicKey publicKey;
    private String keyId;
    private String publicKeyPem;

    public RsaKeyService(RsaKeyProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        try {
            Path path = Path.of(properties.getPrivateKeyPath()).toAbsolutePath().normalize();
            if (Files.isRegularFile(path)) {
                loadFromPem(Files.readString(path, StandardCharsets.UTF_8));
                log.info("RSA private key loaded from {}", path);
            } else if (properties.isGenerateIfMissing()) {
                generateAndPersist(path);
                log.info("RSA keypair generated and saved to {}", path);
            } else {
                throw new IllegalStateException(
                        "RSA private key missing at " + path + " and generate-if-missing=false");
            }
            this.publicKeyPem = toSpkiPem(publicKey);
            this.keyId = fingerprint(publicKey);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize RSA keys", e);
        }
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public String getKeyId() {
        return keyId;
    }

    public String getPublicKeyPem() {
        return publicKeyPem;
    }

    public String getAlgorithm() {
        return ALGORITHM;
    }

    public PrivateKey getPrivateKey() {
        return privateKey;
    }

    public PublicKey getPublicKey() {
        return publicKey;
    }

    private void generateAndPersist(Path path) throws Exception {
        Files.createDirectories(path.getParent() != null ? path.getParent() : Path.of("."));
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(Math.max(2048, properties.getKeySize()));
        KeyPair pair = gen.generateKeyPair();
        this.privateKey = pair.getPrivate();
        this.publicKey = pair.getPublic();
        String pem = toPkcs8Pem(privateKey);
        Files.writeString(path, pem, StandardCharsets.UTF_8);
    }

    private void loadFromPem(String pem) throws Exception {
        String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] der = Base64.getDecoder().decode(normalized);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        this.privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(der));
        if (privateKey instanceof java.security.interfaces.RSAPrivateCrtKey crt) {
            java.security.spec.RSAPublicKeySpec pubSpec =
                    new java.security.spec.RSAPublicKeySpec(crt.getModulus(), crt.getPublicExponent());
            this.publicKey = kf.generatePublic(pubSpec);
        } else {
            throw new IllegalStateException("Private key is not RSA CRT; cannot derive public key");
        }
    }

    private static String toPkcs8Pem(PrivateKey key) {
        String b64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(key.getEncoded());
        return "-----BEGIN PRIVATE KEY-----\n" + b64 + "\n-----END PRIVATE KEY-----\n";
    }

    private static String toSpkiPem(PublicKey key) {
        String b64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(key.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + b64 + "\n-----END PUBLIC KEY-----\n";
    }

    private static String fingerprint(PublicKey key) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] dig = sha.digest(key.getEncoded());
        return HexFormat.of().formatHex(dig).substring(0, 16);
    }
}
