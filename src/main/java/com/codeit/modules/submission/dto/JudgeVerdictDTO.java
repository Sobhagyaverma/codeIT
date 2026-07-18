package com.codeit.modules.submission.dto;

import lombok.Data;

@Data
public class JudgeVerdictDTO {
    private String verdict;
    private int passedCount;
    private int totalCount;
    private Integer failedTestIndex;
    private Double time;
    private Integer memory;
    /** "compile-once" or "progressive-batch" */
    private String engine;
}

