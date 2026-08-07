package com.codeit.modules.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinRoomRequest {
    @NotBlank(message = "inviteToken is required")
    private String inviteToken;
}
