package com.codeit.modules.submission;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.codeit.modules.submission.dto.Judge0Request;
import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.LanguageOption;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private Judge0Service judge0Service;

    @GetMapping("/languages")
    public List<LanguageOption> getLanguages() {
        return Arrays.stream(SupportedLanguage.values())
                .map(SupportedLanguage::toLanguageOption)
                .sorted(Comparator.comparing(LanguageOption::getName))
                .toList();
    }

    @PostMapping("/run")
    public Judge0Result runCode(@RequestBody Judge0Request request) {
        if (request.getLanguageId() == null) {
            throw new IllegalArgumentException("languageId is required");
        }
        SupportedLanguage.resolve(request.getLanguageId(), null);
        return judge0Service.executeCode(
                request.getSourceCode(),
                request.getLanguageId());
    }

    @GetMapping("/user/{userId}")
    public List<Submission> getUserSubmissions(@PathVariable Integer userId) {
        return submissionService.getUserSubmissions(userId);
    }

    @GetMapping("/problem/{problemId}")
    public List<Submission> getProblemSubmissions(@PathVariable Integer problemId) {
        return submissionService.getProblemSubmissions(problemId);
    }

    @PostMapping("/submit")
    public JudgeVerdictDTO submit(@RequestBody Submission submission) {
        return submissionService.submit(submission);
    }
}
