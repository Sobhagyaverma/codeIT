package com.codeit.modules.competition;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.codeit.modules.user.UserRepository;

@Service
public class CompetitionService {
    @Autowired
    private CompetitionRepository competitionRepository;
    @Autowired
    private UserRepository userRepository;

    public String createCompetition(Competition competition) {
        return "Not implemented";
    }
}
