package com.codeit.modules.dsa.dto;

import jakarta.validation.constraints.Size;

public class UpdateDsaFolderRequest {
    @Size(max = 200)
    private String name;

    @Size(max = 4000)
    private String description;

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
}
