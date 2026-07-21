package com.codeit.modules.ai.dto;

import com.codeit.modules.ai.AiAction;
import lombok.Data;

@Data
public class AiCoachResponse {
    private AiAction action;
    private String content;
    private Integer hintLevel;
    private Integer unlockedHintLevel;
}