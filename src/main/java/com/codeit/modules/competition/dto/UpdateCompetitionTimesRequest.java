package com.codeit.modules.competition.dto;

import java.sql.Timestamp;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCompetitionTimesRequest {
    @NotNull(message = "startTime is required")
    private Timestamp startTime;

    @NotNull(message = "endTime is required")
    private Timestamp endTime;
}
