package com.codeit.modules.submission;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Payload / sandbox caps applied to every Judge0 submission.
 * These often save more resources than request-rate limits alone.
 */
@Component
public class JudgeExecutionLimits {

    private final int maxSourceBytes;
    private final int maxStdinBytes;
    private final int maxOutputBytes;
    private final double cpuTimeLimitSeconds;
    private final double wallTimeLimitSeconds;
    private final int memoryLimitKb;
    private final int maxFileSizeKb;
    private final int maxProcesses;

    public JudgeExecutionLimits(
            @Value("${codeit.judge.max-source-bytes:1048576}") int maxSourceBytes,
            @Value("${codeit.judge.max-stdin-bytes:65536}") int maxStdinBytes,
            @Value("${codeit.judge.max-output-bytes:2097152}") int maxOutputBytes,
            @Value("${codeit.judge.cpu-time-limit-seconds:5}") double cpuTimeLimitSeconds,
            @Value("${codeit.judge.wall-time-limit-seconds:10}") double wallTimeLimitSeconds,
            @Value("${codeit.judge.memory-limit-kb:262144}") int memoryLimitKb,
            @Value("${codeit.judge.max-file-size-kb:1024}") int maxFileSizeKb,
            @Value("${codeit.judge.max-processes:64}") int maxProcesses) {
        this.maxSourceBytes = Math.max(1024, maxSourceBytes);
        this.maxStdinBytes = Math.max(0, maxStdinBytes);
        this.maxOutputBytes = Math.max(1024, maxOutputBytes);
        this.cpuTimeLimitSeconds = Math.max(0.1, cpuTimeLimitSeconds);
        this.wallTimeLimitSeconds = Math.max(this.cpuTimeLimitSeconds, wallTimeLimitSeconds);
        this.memoryLimitKb = Math.max(16_384, memoryLimitKb);
        this.maxFileSizeKb = Math.max(64, maxFileSizeKb);
        this.maxProcesses = Math.max(1, maxProcesses);
    }

    public void validateSourceAndStdin(String sourceCode, String stdin) {
        int sourceBytes = utf8Bytes(sourceCode);
        if (sourceBytes > maxSourceBytes) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Source code exceeds max size (" + maxSourceBytes + " bytes)");
        }
        int stdinBytes = utf8Bytes(stdin);
        if (stdinBytes > maxStdinBytes) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stdin exceeds max size (" + maxStdinBytes + " bytes)");
        }
    }

    public String truncateOutput(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        if (bytes.length <= maxOutputBytes) {
            return value;
        }
        // Truncate on UTF-8 boundary
        int end = maxOutputBytes;
        while (end > 0 && end < bytes.length && (bytes[end] & 0xC0) == 0x80) {
            end--;
        }
        return new String(bytes, 0, end, StandardCharsets.UTF_8)
                + "\n…[output truncated]";
    }

    public double getCpuTimeLimitSeconds() {
        return cpuTimeLimitSeconds;
    }

    public double getWallTimeLimitSeconds() {
        return wallTimeLimitSeconds;
    }

    public int getMemoryLimitKb() {
        return memoryLimitKb;
    }

    public int getMaxFileSizeKb() {
        return maxFileSizeKb;
    }

    public int getMaxProcesses() {
        return maxProcesses;
    }

    public int getMaxOutputBytes() {
        return maxOutputBytes;
    }

    private static int utf8Bytes(String value) {
        if (value == null || value.isEmpty()) {
            return 0;
        }
        return value.getBytes(StandardCharsets.UTF_8).length;
    }
}
