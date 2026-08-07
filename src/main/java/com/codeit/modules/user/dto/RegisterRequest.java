package com.codeit.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotEmpty(message = "Name cant be empty")
    private String name;

    @NotEmpty(message = "Unique user ID cant be empty")
    private String uniqueUserId;

    @NotEmpty(message = "Email cant be empty")
    private String email;

    @NotEmpty(message = "Password cant be empty")
    private String password;

    /** When true, password is an RSA-OAEP Base64 ciphertext. */
    private boolean encrypted;

    /** Cloudflare Turnstile token (required when captcha enabled). */
    private String captchaToken;

    /** Required when registration mode requires an invite (INVITE_ONLY / COLLEGE_ONLY). */
    private String inviteCode;
}
