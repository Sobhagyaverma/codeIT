package com.codeit.modules.beta.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectRequestDto {
    @Size(max = 500)
    private String reason;
}
