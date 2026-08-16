package com.codeit.modules.dsa.dto;

import jakarta.validation.constraints.NotNull;

public class MoveProblemRequest {
    @NotNull
    private Integer targetFolderId;
    private Integer position;

    public Integer getTargetFolderId() {
        return targetFolderId;
    }

    public void setTargetFolderId(Integer targetFolderId) {
        this.targetFolderId = targetFolderId;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }
}
