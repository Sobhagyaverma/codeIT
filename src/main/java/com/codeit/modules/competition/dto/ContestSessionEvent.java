package com.codeit.modules.competition.dto;

import lombok.Data;

@Data
public class ContestSessionEvent {
    private Integer competitionId;
    private Integer userId;
    private String sessionStatus;
    private String startedAt;
    private String deadlineAt;
    private String serverTime;
    private Long remainingSeconds;
}
