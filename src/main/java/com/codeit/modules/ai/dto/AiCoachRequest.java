package com.codeit.modules.ai.dto;

import com.codeit.modules.ai.AiAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiCoachRequest {
    @NotNull
    private Integer problemId;
    private String language;
    private Integer languageId;
    @Size(max = 20000)
    private String code;
    private AiAction action;
    private Integer hintLevel;
    @Size(max = 2000)
    private String question;
    private Integer submissionId;
}
