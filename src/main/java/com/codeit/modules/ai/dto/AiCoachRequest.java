package com.codeit.modules.ai.dto;

import com.codeit.modules.ai.AiAction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiCoachRequest {
    @NotNull
    private Integer problemId;
    private String language;
    private Integer languageId;
    private String code;
    private AiAction action;
    private Integer hintLevel;
    private String question;
    private Integer submissionId;
}
