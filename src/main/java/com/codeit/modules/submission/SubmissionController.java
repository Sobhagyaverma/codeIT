package com.codeit.modules.submission;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.codeit.modules.submission.dto.Judge0Request;
import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private Judge0Service judge0Service;

    @PostMapping("/run")
    public Judge0Result runCode(@RequestBody Judge0Request request) {
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
