package com.codeit.modules.competition.dto;

import lombok.Data;

@Data
public class LeaderboardEntry {
    private Integer userId;
    private String userName;
    private Integer solved;
    private double  totalTime;
    private Integer rank;
}
