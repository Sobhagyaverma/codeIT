package com.codeit.modules.problems;

import com.codeit.modules.problems.dto.ProblemPublicDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProblemService {

    @Autowired
    private ProblemRepository problemRepository;

    public List<Problem> getAllProblems() {
        return problemRepository.getAllProblems();
    }

    public Problem getProblemById(Integer id) {
        return problemRepository.getProblemById(id);
    }

    public Problem getProblemForJudge(Integer id) {
        return problemRepository.getProblemById(id);
    }

    public int createProblem(Problem problem) {
        return problemRepository.createProblem(problem);
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
