package com.codeit.modules.profile.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemSummaryDTO {
    private Integer id;
    private String title;
    private String difficulty;
    private List<String> topics = new ArrayList<>();
}