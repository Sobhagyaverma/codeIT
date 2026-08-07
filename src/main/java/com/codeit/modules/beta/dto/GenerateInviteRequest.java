package com.codeit.modules.beta.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateInviteRequest {
    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 120)
    private String fullName;
}
