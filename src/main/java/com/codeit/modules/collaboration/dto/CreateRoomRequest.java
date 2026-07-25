package com.codeit.modules.collaboration.dto;

import lombok.Data;

@Data
public class CreateRoomRequest {
    /** PROBLEM_COLLAB or CODEROOM */
    private String type;
    /** Required for PROBLEM_COLLAB; null for CODEROOM */
    private Integer problemId;
    /** Optional; defaults to java in the service later */
    private String language;
}