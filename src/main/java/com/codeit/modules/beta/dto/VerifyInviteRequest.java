package com.codeit.modules.beta.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyInviteRequest {
    @NotBlank
    @Size(max = 80)
    private String inviteCode;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;
}
