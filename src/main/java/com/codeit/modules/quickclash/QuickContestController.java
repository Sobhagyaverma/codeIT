package com.codeit.modules.quickclash;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.submission.dto.JudgeVerdictDTO;

@RestController
@RequestMapping("/api/quick-clash")
public class QuickContestController {

    private final QuickContestService service;

    public QuickContestController(QuickContestService service) {
        this.service = service;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        return service.create(body);
    }

    @GetMapping("/history")
    public Map<String, Object> history() {
        return service.history();
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable long id) {
        return service.getContest(id);
    }

    @PostMapping("/{id}/invite")
    public Map<String, Object> invite(@PathVariable long id, @RequestBody Map<String, Object> body) {
        List<Integer> friendIds = List.of();
        Object raw = body.get("friendUserIds");
        if (raw instanceof List<?> list) {
            friendIds = list.stream()
                    .filter(Number.class::isInstance)
                    .map(n -> ((Number) n).intValue())
                    .toList();
        }
        return service.invite(id, friendIds);
    }

    @PostMapping("/{id}/join")
    public Map<String, Object> join(@PathVariable long id) {
        return service.join(id);
    }

    @PostMapping("/{id}/ready")
    public Map<String, Object> ready(@PathVariable long id, @RequestBody Map<String, Object> body) {
        boolean ready = Boolean.TRUE.equals(body.get("ready"))
                || "true".equalsIgnoreCase(String.valueOf(body.get("ready")));
        return service.setReady(id, ready);
    }

    @PostMapping("/{id}/leave")
    public Map<String, Object> leave(@PathVariable long id) {
        return service.leave(id);
    }

    @PostMapping("/{id}/start")
    public Map<String, Object> start(@PathVariable long id) {
        return service.start(id);
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable long id) {
        return service.cancel(id);
    }

    @PostMapping("/{id}/submit")
    public JudgeVerdictDTO submit(@PathVariable long id, @RequestBody Map<String, Object> body) {
        return service.submit(id, body);
    }

    @GetMapping("/{id}/leaderboard")
    public List<Map<String, Object>> leaderboard(@PathVariable long id) {
        return service.leaderboard(id);
    }
}
