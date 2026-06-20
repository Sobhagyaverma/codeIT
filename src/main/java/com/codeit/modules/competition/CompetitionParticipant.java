package com.codeit.modules.competition;

import java.sql.Timestamp;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data
public class CompetitionParticipant {
    
    private Integer id;
    @NotNull(message = "competitionId is required")
    private Integer competitionId;
    @NotNull(message = "userId is required")
    private Integer userId;
    
    private Timestamp joinedAt;
}
