package com.codeit.modules.friends;

import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public Map<String, Object> list() {
        return friendService.listAll();
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam("q") String q) {
        return friendService.search(q);
    }

    @PostMapping("/request")
    public Map<String, Object> request(@RequestBody Map<String, String> body) {
        return friendService.sendRequest(body.get("uniqueUserId"));
    }

    @PostMapping("/requests/{id}/respond")
    public Map<String, Object> respond(@PathVariable long id, @RequestBody Map<String, String> body) {
        return friendService.respond(id, body.get("action"));
    }

    @DeleteMapping("/{userId}")
    public Map<String, Object> remove(@PathVariable int userId) {
        return friendService.removeFriend(userId);
    }
}
