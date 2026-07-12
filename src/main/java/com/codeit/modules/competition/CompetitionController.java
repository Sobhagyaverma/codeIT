package com.codeit.modules.competition;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.competition.dto.AddProblemsRequest;
import com.codeit.modules.competition.dto.ContestSessionEvent;
import com.codeit.modules.competition.dto.ContestSubmissionRequest;
import com.codeit.modules.competition.dto.LeaderboardEntry;
import com.codeit.modules.competition.dto.UpdateCompetitionTimesRequest;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/competitions")
public class CompetitionController {

    @Autowired
    private CompetitionService competitionService;

    @PostMapping("/create")
    public String createCompetition(@Valid @RequestBody Competition competition) {
        return competitionService.createCompetition(competition);
    }

    @GetMapping("/getAllCompetitions")
    public List<Competition> getAllCompetitions() {
        return competitionService.getAllCompetitions();
    }

    @GetMapping("/get/{id}")
    public Competition getCompetitionById(@PathVariable("id") int id) {
        return competitionService.getCompetitionById(id);
    }

    @PostMapping("/addProblemsTo/{competitionsId}/problems")
    public String addProblems(
            @PathVariable("competitionsId") Integer competitionsId,
            @Valid @RequestBody AddProblemsRequest request) {
        return competitionService.addProblems(competitionsId, request.getProblemIds());
    }

    @GetMapping("/getProblemsOf/{competitionId}/problems")
    public List<Integer> getProblems(@PathVariable("competitionId") Integer competitionId) {
        return competitionService.getCompetitionProblems(competitionId);
    }

    @PostMapping("/{competitionId}/join")
    public String joinCompetition(@PathVariable Integer competitionId) {
        return competitionService.joinCompetition(competitionId, SecurityUtils.currentUserId());
    }

    @PostMapping("/{competitionId}/start")
    public ContestSessionEvent startCompetitionSession(@PathVariable Integer competitionId) {
        return competitionService.startCompetitionSession(competitionId, SecurityUtils.currentUserId());
    }

    @GetMapping("/{competitionId}/session")
    public ContestSessionEvent getCompetitionSession(@PathVariable Integer competitionId) {
        return competitionService.getCompetitionSession(competitionId, SecurityUtils.currentUserId());
    }

    @GetMapping("/{competitionId}/participants")
    public List<Integer> getParticipants(@PathVariable Integer competitionId) {
        return competitionService.getParticipants(competitionId);
    }

    @PostMapping("/{competitionId}/submit")
    public JudgeVerdictDTO submitCompetitionSolution(
            @PathVariable Integer competitionId,
            @RequestBody ContestSubmissionRequest request) {
        return competitionService.submitCompetitionSolution(competitionId, request);
    }

    @GetMapping("/{competitionId}/leaderboard")
    public List<LeaderboardEntry> getLeaderboard(@PathVariable Integer competitionId) {
        return competitionService.getLeaderboard(competitionId);
    }

    @PatchMapping("/{competitionId}/times")
    public Competition updateCompetitionTimes(
            @PathVariable Integer competitionId,
            @Valid @RequestBody UpdateCompetitionTimesRequest request) {
        return competitionService.updateCompetitionTimes(competitionId, request);
    }
}
