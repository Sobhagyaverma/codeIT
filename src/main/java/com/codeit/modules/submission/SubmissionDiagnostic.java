package com.codeit.modules.submission;

import lombok.Data;

@Data
public class SubmissionDiagnostic {
    private Integer submissionId;
    private String verdict;
    private int passedCount;
    private int totalCount;
    private Integer failedIndex;
    private String compileOutput;
    private String stderrSummary;
    private String judgeEngine;
}
