package com.codeit.modules.dsa.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class DsaTreeFolderNode {
    private Integer id;
    private Integer sheetId;
    private Integer parentId;
    private String name;
    private String description;
    private int position;
    private Instant createdAt;
    private Instant updatedAt;
    private int directProblemCount;
    private int subfolderCount;
    private int totalProblemCount;
    private List<DsaTreeFolderNode> children = new ArrayList<>();
    private List<DsaTreeProblemNode> problems = new ArrayList<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSheetId() {
        return sheetId;
    }

    public void setSheetId(Integer sheetId) {
        this.sheetId = sheetId;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getDirectProblemCount() {
        return directProblemCount;
    }

    public void setDirectProblemCount(int directProblemCount) {
        this.directProblemCount = directProblemCount;
    }

    public int getSubfolderCount() {
        return subfolderCount;
    }

    public void setSubfolderCount(int subfolderCount) {
        this.subfolderCount = subfolderCount;
    }

    public int getTotalProblemCount() {
        return totalProblemCount;
    }

    public void setTotalProblemCount(int totalProblemCount) {
        this.totalProblemCount = totalProblemCount;
    }

    public List<DsaTreeFolderNode> getChildren() {
        return children;
    }

    public void setChildren(List<DsaTreeFolderNode> children) {
        this.children = children != null ? children : new ArrayList<>();
    }

    public List<DsaTreeProblemNode> getProblems() {
        return problems;
    }

    public void setProblems(List<DsaTreeProblemNode> problems) {
        this.problems = problems != null ? problems : new ArrayList<>();
    }
}
