package com.codeit.modules.dsa.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public class ReorderFoldersRequest {
    /** Common parent; null = root of sheet. */
    private Integer parentId;

    @NotNull
    private Integer sheetId;

    @NotEmpty
    private List<Integer> folderIds;

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public Integer getSheetId() {
        return sheetId;
    }

    public void setSheetId(Integer sheetId) {
        this.sheetId = sheetId;
    }

    public List<Integer> getFolderIds() {
        return folderIds;
    }

    public void setFolderIds(List<Integer> folderIds) {
        this.folderIds = folderIds;
    }
}
