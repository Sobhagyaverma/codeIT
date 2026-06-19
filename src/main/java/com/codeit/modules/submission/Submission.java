package com.codeit.modules.submission;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Submission {

    private Integer id;
    private Integer userId;
    private Integer problemId;
    private String language;
    private Integer languageId;
    private String code;
    private String verdict;
    private String output;
    private Double executionTime;
    private Integer memoryUsed;
}