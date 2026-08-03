package com.codeit.modules.profile.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotEmpty(message = "Current password is required")
    private String currentPassword;

    @NotEmpty(message = "New password is required")
    private String newPassword;

    /** When true, password fields are RSA-OAEP Base64 ciphertexts. */
    private boolean encrypted;
}
