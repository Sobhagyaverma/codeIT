package com.codeit.modules.collaboration.dto;

import lombok.Data;

@Data
public class UpdateMemberRequest {
    /** HOST | EDITOR | VIEWER — required when not removing */
    private String role;
}