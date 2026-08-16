package com.codeit.modules.dsa.dto;

import java.util.List;

public class AssignProblemsResponse {
    private int added;
    private List<Integer> alreadyPresent;
    private List<Integer> missing;

    public AssignProblemsResponse() {
    }

    public AssignProblemsResponse(int added, List<Integer> alreadyPresent, List<Integer> missing) {
        this.added = added;
        this.alreadyPresent = alreadyPresent;
        this.missing = missing;
    }

    public int getAdded() {
        return added;
    }

    public void setAdded(int added) {
        this.added = added;
    }

    public List<Integer> getAlreadyPresent() {
        return alreadyPresent;
    }

    public void setAlreadyPresent(List<Integer> alreadyPresent) {
        this.alreadyPresent = alreadyPresent;
    }

    public List<Integer> getMissing() {
        return missing;
    }

    public void setMissing(List<Integer> missing) {
        this.missing = missing;
    }
}
