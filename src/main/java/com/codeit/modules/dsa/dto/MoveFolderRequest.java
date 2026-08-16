package com.codeit.modules.dsa.dto;

public class MoveFolderRequest {
    /** Null = move to sheet root. */
    private Integer parentId;
    private Integer position;

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }
}
