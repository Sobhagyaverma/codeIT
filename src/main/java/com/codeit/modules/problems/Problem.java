package com.codeit.modules.problems;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Problem {
    private Integer id;
    private String title;
    private String description;
    private String difficulty;
    private String topics;
    private String examples;
    private String constraintsData;
    private String testCases;
}
