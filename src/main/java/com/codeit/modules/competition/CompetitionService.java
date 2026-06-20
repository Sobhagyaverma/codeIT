package com.codeit.modules.competition;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.codeit.modules.problems.ProblemRepository;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;

@Service
public class CompetitionService {
    @Autowired
    private CompetitionRepository competitionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProblemRepository problemRepository;

    public String createCompetition(Competition competition) {
        if (competition.getCreatedBy() == null) {
            return "createdBy is required";
        }
        requireAdmin(competition.getCreatedBy());
        competitionRepository.createCompetition(competition);
        return "Competition created successfully";
    }

    public List<Competition> getAllCompetitions() {
        return competitionRepository.getAllCompetitions();
    }

    public Competition getCompetitionById(Integer id) {
        return competitionRepository.getCompetitionById(id);
    }

    public String addProblems(Integer competitionId, Integer userId, List<Integer> problemIds) {
        requireAdmin(userId);

        if (getCompetitionById(competitionId) == null) {
            return "Competition not found";
        }

        for (Integer problemId : problemIds) {
            if (!problemRepository.existsById(problemId)) {
                return "Problem not found: " + problemId;
            }
        }

        for (Integer problemId : problemIds) {
            competitionRepository.addProblemsToCompetitions(competitionId, problemId);
        }
        return "Problems added successfully";
    }

    public List<Integer> getCompetitionProblems(Integer competitionId) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }
        return competitionRepository.getCompetitionProblems(competitionId);
    }

    private void requireAdmin(Integer userId) {
        if (userId == null) {
            throw new RuntimeException("userId is required");
        }
        User user = userRepository.getUserById(userId).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (!"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Only admin can perform this action");
        }
    }
}
