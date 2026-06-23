package com.codeit.modules.competition;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class Competition {

    private Integer id;
    private String title;
    private String description;
    private Timestamp startTime;
    private Timestamp endTime;
    private Integer createdBy;
    private String status;
    private Integer durationMinutes;

}
