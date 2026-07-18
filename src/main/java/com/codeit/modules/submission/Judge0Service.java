package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.Judge0TokenResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class Judge0Service {

    private static final int MULTI_FILE_LANGUAGE_ID = 89;

    private final String waitSubmissionUrl;
    private final String batchCreateUrl;
    private final String batchGetUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final long pollIntervalMs;
    private final long pollTimeoutMs;

    public Judge0Service(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${judge0.api.url:http://localhost:2358}") String judge0BaseUrl,
            @Value("${codeit.judge.poll-interval-ms:200}") long pollIntervalMs,
            @Value("${codeit.judge.poll-timeout-ms:60000}") long pollTimeoutMs) {

        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.pollIntervalMs = pollIntervalMs;
        this.pollTimeoutMs = pollTimeoutMs;

        String baseUrl = judge0BaseUrl.endsWith("/")
                ? judge0BaseUrl.substring(0, judge0BaseUrl.length() - 1)
                : judge0BaseUrl;

        this.waitSubmissionUrl = baseUrl + "/submissions/?base64_encoded=false&wait=true";

        this.batchCreateUrl = baseUrl + "/submissions/batch?base64_encoded=false";

        this.batchGetUrl = baseUrl + "/submissions/batch?base64_encoded=false&tokens=";
    }

    /*
     * Single execution used by the Run endpoint.
     */
    public Judge0Result executeCode(
            String sourceCode,
            Integer languageId) {

        return executeCode(sourceCode, languageId, null);
    }

    /*
     * Keep wait=true for single Run requests.
     */
    public Judge0Result executeCode(
            String sourceCode,
            Integer languageId,
            String stdin) {

        try {
            Map<String, Object> body = createSubmissionBody(sourceCode, languageId, stdin);

            ResponseEntity<Judge0Result> response = restTemplate.postForEntity(
                    waitSubmissionUrl,
                    createJsonEntity(body),
                    Judge0Result.class);

            Judge0Result result = response.getBody();

            if (result == null) {
                throw new RuntimeException(
                        "Judge0 returned an empty response");
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Judge0 request failed", e);
        }
    }

    public Judge0Result executeMultiFileProgram(
            String additionalFilesBase64,
            double cpuTimeLimit,
            double wallTimeLimit) {

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("language_id", MULTI_FILE_LANGUAGE_ID);
            body.put("additional_files", additionalFilesBase64);
            body.put("cpu_time_limit", cpuTimeLimit);
            body.put("wall_time_limit", wallTimeLimit);

            ResponseEntity<Judge0Result> response = restTemplate.postForEntity(
                    waitSubmissionUrl,
                    createJsonEntity(body),
                    Judge0Result.class);

            Judge0Result result = response.getBody();
            if (result == null) {
                throw new RuntimeException("Judge0 returned an empty multi-file response");
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Judge0 multi-file request failed", e);
        }
    }

    /*
     * Creates multiple Judge0 submissions and returns their tokens
     * in the same order as the provided stdin values.
     */
    public List<String> createBatch(
            String sourceCode,
            Integer languageId,
            List<String> stdins) {

        if (stdins == null || stdins.isEmpty()) {
            return List.of();
        }

        try {
            List<Map<String, Object>> submissions = new ArrayList<>(stdins.size());

            for (String stdin : stdins) {
                submissions.add(
                        createSubmissionBody(
                                sourceCode,
                                languageId,
                                stdin));
            }

            Map<String, Object> body = new HashMap<>();
            body.put("submissions", submissions);

            ResponseEntity<Judge0TokenResponse[]> response = restTemplate.postForEntity(
                    batchCreateUrl,
                    createJsonEntity(body),
                    Judge0TokenResponse[].class);

            Judge0TokenResponse[] tokenResponses = response.getBody();

            if (tokenResponses == null
                    || tokenResponses.length != stdins.size()) {

                throw new RuntimeException(
                        "Judge0 returned an invalid batch response");
            }

            List<String> tokens = new ArrayList<>(tokenResponses.length);

            for (int i = 0; i < tokenResponses.length; i++) {
                Judge0TokenResponse tokenResponse = tokenResponses[i];

                if (tokenResponse == null
                        || tokenResponse.getToken() == null
                        || tokenResponse.getToken().isBlank()) {

                    throw new RuntimeException(
                            "Judge0 rejected batch item #" + (i + 1));
                }

                tokens.add(tokenResponse.getToken());
            }

            return tokens;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to create Judge0 batch", e);
        }
    }

    /*
     * Fetches the current results for the provided tokens.
     */
    public List<Judge0Result> getBatch(
            List<String> tokens) {

        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }

        try {
            String tokenQuery = String.join(",", tokens);

            String url = batchGetUrl
                    + tokenQuery
                    + "&fields=token,stdout,stderr,"
                    + "compile_output,time,memory,status";

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            String responseBody = response.getBody();

            if (responseBody == null
                    || responseBody.isBlank()) {

                throw new RuntimeException(
                        "Judge0 returned an empty batch response");
            }

            JsonNode root = objectMapper.readTree(responseBody);

            JsonNode submissionsNode = root.get("submissions");

            if (submissionsNode == null
                    || !submissionsNode.isArray()) {

                throw new RuntimeException(
                        "Judge0 batch response has no submissions");
            }

            List<Judge0Result> results = objectMapper.convertValue(
                    submissionsNode,
                    new TypeReference<List<Judge0Result>>() {
                    });

            return orderResultsByToken(tokens, results);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to fetch Judge0 batch", e);
        }
    }

    /*
     * Creates a batch and polls until all submissions finish.
     */
    public List<Judge0Result> executeBatchAndWait(
            String sourceCode,
            Integer languageId,
            List<String> stdins) {

        if (stdins == null || stdins.isEmpty()) {
            return List.of();
        }

        List<String> tokens = createBatch(sourceCode, languageId, stdins);

        long deadlineNanos = System.nanoTime()
                + pollTimeoutMs * 1_000_000L;

        while (System.nanoTime() < deadlineNanos) {
            List<Judge0Result> results = getBatch(tokens);

            if (allFinished(results, tokens.size())) {
                return results;
            }

            try {
                Thread.sleep(pollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();

                throw new RuntimeException(
                        "Judge0 batch polling interrupted", e);
            }
        }

        throw new RuntimeException(
                "Judge0 batch polling timed out after "
                        + pollTimeoutMs
                        + "ms");
    }

    private Map<String, Object> createSubmissionBody(
            String sourceCode,
            Integer languageId,
            String stdin) {

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("source_code", sourceCode);
        body.put("language_id", languageId);
        body.put("stdin", stdin != null ? stdin : "");

        return body;
    }

    private HttpEntity<String> createJsonEntity(
            Map<String, Object> body) {

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            return new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Judge0 request", e);
        }
    }

    private boolean allFinished(
            List<Judge0Result> results,
            int expectedCount) {

        if (results == null
                || results.size() != expectedCount) {
            return false;
        }

        return results.stream().allMatch(result -> result != null
                && result.getStatus() != null
                && result.getStatus().getId() != null
                && result.getStatus().getId() > 2);
    }

    /*
     * Judge0 normally returns batch results in request order.
     * This explicitly restores token order for safety.
     */
    private List<Judge0Result> orderResultsByToken(
            List<String> tokens,
            List<Judge0Result> results) {

        Map<String, Judge0Result> resultsByToken = new HashMap<>();
        for (Judge0Result result : results) {
            if (result != null && result.getToken() != null) {
                resultsByToken.putIfAbsent(result.getToken(), result);
            }
        }

        List<Judge0Result> ordered = new ArrayList<>(tokens.size());

        for (String token : tokens) {
            Judge0Result result = resultsByToken.get(token);

            if (result == null) {
                throw new RuntimeException(
                        "Judge0 omitted result for token "
                                + token);
            }

            ordered.add(result);
        }

        return ordered;
    }
}