package com.codeit.modules.submission;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.SecurityUtils;
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
                request.getLanguageId(),
                request.getStdin());
    }

    @GetMapping("/user/{userId}")
    public List<Submission> getUserSubmissions(@PathVariable Integer userId) {
        Integer currentUserId = SecurityUtils.currentUserId();
        if (!currentUserId.equals(userId) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view other users submissions");
        }
        return submissionService.getUserSubmissions(userId);
    }

    @GetMapping("/problem/{problemId}")
    public List<Submission> getProblemSubmissions(@PathVariable Integer problemId) {
        Integer currentUserId = SecurityUtils.currentUserId();
        if (SecurityUtils.isAdmin()) {
            return submissionService.getProblemSubmissions(problemId);
        }
        return submissionService.getMyProblemSubmissions(currentUserId, problemId);
    }

    @PostMapping("/submit")
    public JudgeVerdictDTO submit(@RequestBody Submission submission) {
        submission.setUserId(SecurityUtils.currentUserId());
        return submissionService.submit(submission);
    }
}
