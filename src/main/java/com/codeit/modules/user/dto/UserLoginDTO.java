package com.codeit.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserLoginDTO {
    @NotEmpty(message = "Email or unique user ID is required")
    private String login;
    @NotEmpty(message = "Password cant be empty")
    private String password;

    /** When true, login + password are RSA-OAEP Base64 ciphertexts. */
    private boolean encrypted;
}
