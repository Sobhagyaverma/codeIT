package com.codeit.modules.notifications;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(defaultValue = "50") int limit) {
        return notificationService.listMine(limit);
    }

    @GetMapping("/unread-count")
    public Map<String, Object> unreadCount() {
        return notificationService.unreadCount();
    }

    @PostMapping("/{id}/read")
    public Map<String, Object> markRead(@PathVariable long id) {
        return notificationService.markRead(id);
    }

    @PostMapping("/read-all")
    public Map<String, Object> markAllRead() {
        return notificationService.markAllRead();
    }
}
