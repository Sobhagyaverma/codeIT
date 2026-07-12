package com.codeit.modules.competition.dto;

import lombok.Data;

@Data
public class ContestSubmissionRequest {
    private Integer problemId;
    private Integer languageId;
    private String language;
    private String code;
}
