package com.codeit.modules.competition;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.codeit.modules.competition.dto.ContestSubmissionRequest;
import com.codeit.modules.problems.ProblemRepository;
import com.codeit.modules.submission.Submission;
import com.codeit.modules.submission.SubmissionService;
import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
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
    @Autowired
    private SubmissionService submissionService;

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

    public String joinCompetition(Integer competitionId, Integer userID) {
        if (getCompetitionById(competitionId) == null) {
            return "Competition not found";
        }

        User user = userRepository.getUserById(userID).orElse(null);
        if (user == null) {
            return "User not found";
        }

        Integer count = competitionRepository.alreadyJoined(competitionId, userID);
        if (count > 0) {
            return "User already joined";
        }
        competitionRepository.joinCompetition(competitionId, userID);
        return "joined suksexfully";
    }

    public List<Integer> getParticipants(Integer competitionId) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }
        return competitionRepository.getParticipants(competitionId);
    }

    public JudgeVerdictDTO submitCompetitionSolution(Integer competitionId, ContestSubmissionRequest request) {
        Competition competition = competitionRepository.getCompetitionById(competitionId);
        if (competition == null) {
            throw new RuntimeException("Competition not found");
        }

        Integer count = competitionRepository.alreadyJoined(competitionId, request.getUserId());
        if (count == 0) {
            throw new RuntimeException("user not joined this Competition");
        }
        LocalDateTime now = LocalDateTime.now();
        // if (now.isBefore(competition.getStartTime().toLocalDateTime())) {
        // throw new RuntimeException(
        // "Competition has not started");
        // }

        // if (now.isAfter(competition.getEndTime().toLocalDateTime())) {
        // throw new RuntimeException("Competition id Ended");
        // }
        Submission submission =

                new Submission();

        submission.setUserId(

                request.getUserId()

        );

        submission.setProblemId(

                request.getProblemId()

        );

        submission.setCompetitionId(

                competitionId

        );

        submission.setLanguage(

                request.getLanguage()

        );

        submission.setLanguageId(

                request.getLanguageId()

        );

        submission.setCode(

                request.getCode()

        );

        return submissionService.submit(submission);

    }

}
