package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.TestCaseDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestCaseParser {

    private final ObjectMapper objectMapper;

    public TestCaseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<TestCaseDTO> parse(String testCasesJson) {
        if (testCasesJson == null || testCasesJson.isBlank()) {
            throw new IllegalArgumentException("test_cases is empty");
        }

        try {
            List<TestCaseDTO> testCases = objectMapper.readValue(
                    testCasesJson,
                    new TypeReference<List<TestCaseDTO>>() {
                    });

            if (testCases == null || testCases.isEmpty()) {
                throw new IllegalArgumentException("No test cases found");
            }

            return testCases;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid test_cases JSON", e);
        }
    }
}