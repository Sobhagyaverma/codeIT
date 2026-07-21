package com.codeit.modules.profile;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.profile.dto.ChangePasswordRequest;
import com.codeit.modules.profile.dto.ProblemSummaryDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ContestHistoryDTO;
import com.codeit.modules.profile.dto.ProfileSubmissionsPageDTO;
import com.codeit.modules.profile.dto.UpdateProfileRequest;
import com.codeit.modules.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
@Validated
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/me")
    public ProfileResponseDTO getMe() {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.getMyProfile(userId);
    }

    @GetMapping("/{username}")
    public ProfileResponseDTO getPublicProfile(@PathVariable String username) {
        return profileService.getPublicProfile(username);
    }

    @PatchMapping("/me")
    public User updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.updateMyProfile(userId, request);
    }

    @PostMapping("/me/password")
    public String changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        profileService.changePassword(userId, request);
        return "Password updated successfully";
    }

    @GetMapping("/me/bookmarks")
    public List<ProblemSummaryDTO> getBookmarks() {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.getMyBookmarks(userId);
    }

    @PostMapping("/me/bookmarks/{problemId}")
    public String addBookmark(@PathVariable Integer problemId) {
        Integer userId = SecurityUtils.currentUserId();
        profileService.addBookmark(userId, problemId);
        return "Bookmark added";
    }

    @DeleteMapping("/me/bookmarks/{problemId}")
    public String removeBookmark(@PathVariable Integer problemId) {
        Integer userId = SecurityUtils.currentUserId();
        profileService.removeBookmark(userId, problemId);
        return "Bookmark removed";
    }

    @PostMapping("/me/recent-problems/{problemId}")
    public String recordRecentView(@PathVariable Integer problemId) {
        Integer userId = SecurityUtils.currentUserId();
        profileService.recordRecentView(userId, problemId);
        return "Recent view recorded";
    }

    @GetMapping("/me/recent-problems")
    public List<ProblemSummaryDTO> getRecentViews() {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.getMyRecentViews(userId);
    }

    @GetMapping("/me/submissions")
    public ProfileSubmissionsPageDTO getSubmissions(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer cursor) {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.getMySubmissions(userId, limit, cursor);
    }

    @GetMapping("/me/contests")
    public List<ContestHistoryDTO> getContests() {
        Integer userId = SecurityUtils.currentUserId();
        return profileService.getMyContests(userId);
    }
}