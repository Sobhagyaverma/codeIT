package com.codeit.modules.competition.dto;

import lombok.Data;

@Data
public class ContestSubmissionRequest {
    private Integer userId;
    private Integer competitionId;
    private Integer problemId;
    private Integer languageId;
    private String language;
    private String code;
}
