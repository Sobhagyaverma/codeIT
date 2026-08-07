package com.codeit.modules.beta.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BetaAccessRequestDto {
    @NotBlank
    @Size(max = 120)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 200)
    private String college;

    @NotBlank
    @Size(max = 40)
    private String year;

    @Size(max = 2000)
    private String reason;

    private String captchaToken;
}
