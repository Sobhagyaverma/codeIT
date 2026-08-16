package com.codeit.modules.dsa.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public class AssignProblemsRequest {
    @NotEmpty
    private List<Integer> problemIds;

    public List<Integer> getProblemIds() {
        return problemIds;
    }

    public void setProblemIds(List<Integer> problemIds) {
        this.problemIds = problemIds;
    }
}
