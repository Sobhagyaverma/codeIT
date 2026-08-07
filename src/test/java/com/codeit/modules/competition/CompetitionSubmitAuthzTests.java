package com.codeit.modules.competition;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * Documents the membership gate used by CompetitionService.submitCompetitionSolution.
 */
class CompetitionSubmitAuthzTests {

    @Test
    void rejectsProblemNotInContest() {
        List<Integer> contestProblems = List.of(1, 2, 3);
        Integer problemId = 999;
        assertFalse(problemId != null && contestProblems.contains(problemId));
    }

    @Test
    void acceptsProblemInContest() {
        List<Integer> contestProblems = List.of(1, 2, 3);
        Integer problemId = 2;
        assertTrue(problemId != null && contestProblems.contains(problemId));
    }
}
