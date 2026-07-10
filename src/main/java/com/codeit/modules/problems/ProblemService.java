package com.codeit.modules.problems;

import com.codeit.modules.problems.dto.ProblemPublicDTO;
import com.codeit.modules.submission.TestCaseCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProblemService {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ProblemCacheService problemCacheService;

    @Autowired
    private TestCaseCacheService testCaseCacheService;

    public List<Problem> getAllProblems() {
        return problemCacheService.getAll()
                .orElseGet(() -> {
                    List<Problem> problems = problemRepository.getAllProblems();
                    problemCacheService.putAll(problems);
                    return problems;
                });
    }

    public Problem getProblemById(Integer id) {
        return problemCacheService.getPublicById(id)
                .orElseGet(() -> {
                    Problem problem = problemRepository.getProblemById(id);
                    if (problem != null) {
                        problemCacheService.putPublic(id, problem);
                    }
                    return problem;
                });
    }

    public Problem getProblemForJudge(Integer id) {
        return problemCacheService.getForJudge(id)
                .orElseGet(() -> {
                    Problem problem = problemRepository.getProblemById(id);
                    if (problem != null) {
                        problemCacheService.putForJudge(id, problem);
                    }
                    return problem;
                });
    }

    public int createProblem(Problem problem) {
        int result = problemRepository.createProblem(problem);
        if (result > 0) {
            problemCacheService.invalidateAll();
            testCaseCacheService.invalidateAll();
        }
        return result;
    }

    public List<Problem> getProblemsByDifficulty(String difficulty) {
        return problemRepository.getProblemsByDifficulty(difficulty);
    }

    public List<Problem> getProblemsByTopic(String topic) {
        return problemRepository.getProblemsByTopic(topic);
    }

    public List<Problem> searchProblems(String keyword) {
        return problemRepository.searchProblems(keyword);
    }

    public ProblemPublicDTO toPublicDTO(Problem problem) {
        if (problem == null) {
            return null;
        }
        ProblemPublicDTO dto = new ProblemPublicDTO();
        dto.setId(problem.getId());
        dto.setTitle(problem.getTitle());
        dto.setDescription(problem.getDescription());
        dto.setDifficulty(problem.getDifficulty());
        dto.setTopics(problem.getTopics());
        dto.setExamples(problem.getExamples());
        dto.setConstraintsData(problem.getConstraintsData());
        return dto;
    }
}
