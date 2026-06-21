package com.codeit.modules.competition;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.competition.dto.AddProblemsRequest;
import com.codeit.modules.competition.dto.ContestSubmissionRequest;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("api/competitions")
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
        return competitionService.addProblems(
                competitionsId,
                request.getUserId(),
                request.getProblemIds());
    }

    @GetMapping("/getProblemsOf/{competitionId}/problems")
    public List<Integer> getProblems(@PathVariable("competitionId") Integer competitionId) {
        return competitionService.getCompetitionProblems(competitionId);
    }

    @PostMapping("/{competitionId}/join")
    public String joinCompetition(@PathVariable Integer competitionId,
            @RequestParam Integer userId) {
        return competitionService.joinCompetition(competitionId, userId);
    }
    @GetMapping("/{competitionId}/participants")
    public List<Integer> getParticipants(@PathVariable Integer competitionId) {
        return competitionService.getParticipants(competitionId);
    }

    @PostMapping("/{competitionId}/submit")
    public JudgeVerdictDTO submitCompetitionSolution(@PathVariable Integer competitionId ,
                                @RequestBody ContestSubmissionRequest request) {
        
        
        return competitionService.submitCompetitionSolution(competitionId, request);
    }
    

}
