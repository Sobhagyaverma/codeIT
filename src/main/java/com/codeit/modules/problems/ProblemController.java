package com.codeit.modules.problems;

import com.codeit.modules.problems.dto.ProblemPublicDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    @Autowired
    private ProblemService problemService;

    @GetMapping
    public List<ProblemPublicDTO> getAllProblems() {
        return problemService.getAllProblems().stream()
                .map(problemService::toPublicDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ProblemPublicDTO getProblemById(@PathVariable Integer id) {
        return problemService.toPublicDTO(problemService.getProblemById(id));
    }

    @PostMapping
    public String createProblem(@RequestBody Problem problem) {
        int result = problemService.createProblem(problem);
        if (result > 0) {
            return "Problem Created";
        }
        return "Failed";
    }

    @GetMapping("/difficulty/{difficulty}")
    public List<ProblemPublicDTO> getProblemsByDifficulty(@PathVariable String difficulty) {
        return problemService.getProblemsByDifficulty(difficulty).stream()
                .map(problemService::toPublicDTO)
                .toList();
    }

    @GetMapping("/topic/{topic}")
    public List<ProblemPublicDTO> getProblemsByTopic(@PathVariable String topic) {
        return problemService.getProblemsByTopic(topic).stream()
                .map(problemService::toPublicDTO)
                .toList();
    }

    @GetMapping("/search")
    public List<ProblemPublicDTO> searchProblems(@RequestParam String keyword) {
        return problemService.searchProblems(keyword).stream()
                .map(problemService::toPublicDTO)
                .toList();
    }
}
