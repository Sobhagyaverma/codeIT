package com.codeit.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
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
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
