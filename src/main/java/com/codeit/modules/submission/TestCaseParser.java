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

            for (TestCaseDTO testCase : testCases) {
                testCase.setStdin(unescapeIoString(testCase.getStdin()));
                testCase.setStdout(unescapeIoString(testCase.getStdout()));
            }

            return testCases;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid test_cases JSON", e);
        }
    }

    /**
     * Fix I/O that was stored with literal {@code \n} (common with non-E'...' SQL)
     * instead of real newlines.
     */
    static String unescapeIoString(String value) {
        if (value == null || value.isEmpty()) {
            return value == null ? "" : value;
        }
        if (!value.contains("\\n") && !value.contains("\\r") && !value.contains("\\t")) {
            return value;
        }
        if (value.indexOf('\n') >= 0 || value.indexOf('\r') >= 0) {
            return value;
        }
        return value
                .replace("\\r\\n", "\n")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }
}
