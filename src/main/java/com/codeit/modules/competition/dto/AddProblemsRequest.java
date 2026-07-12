package com.codeit.modules.competition.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddProblemsRequest {
    @NotEmpty(message = "problemIds is required")
    private List<@NotNull Integer> problemIds;
}
