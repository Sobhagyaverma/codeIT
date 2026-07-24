package com.codeit.modules.collaboration.dto;

import lombok.Data;

@Data
public class RoomRunRequest {
    private String sourceCode;
    private Integer languageId;
    private String stdin;
}
