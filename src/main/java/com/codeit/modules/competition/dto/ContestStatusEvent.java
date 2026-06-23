package com.codeit.modules.competition.dto;

import lombok.Data;

@Data
public class ContestStatusEvent {
    private Integer competitionId;
    private String status;
    private String startTime;
    private String endTime;
    private String serverTime;
}