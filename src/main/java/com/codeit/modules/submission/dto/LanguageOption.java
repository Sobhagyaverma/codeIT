package com.codeit.modules.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LanguageOption {
    private String slug;
    private String name;
    private int languageId;
}
