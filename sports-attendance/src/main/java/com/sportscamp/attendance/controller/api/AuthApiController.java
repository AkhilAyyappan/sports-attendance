package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.SportService;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthApiController {

    private final UserService userService;
    private final SportService sportService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.findByUsername(auth.getName());
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("role", user.getRole().name());
        result.put("enabled", user.isEnabled());

        if (user.getRole() == User.Role.ROLE_CAPTAIN) {
            List<Sport> sports = sportService.findByCaptainId(user.getId());
            List<Map<String, Object>> sportsList = sports.stream()
                    .map(s -> Map.<String, Object>of("id", s.getId(), "name", s.getName()))
                    .toList();
            result.put("sports", sportsList);
            if (!sports.isEmpty()) {
                result.put("sportId", sports.get(0).getId());
                result.put("sportName", sports.get(0).getName());
            }
        }

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.findByUsername(auth.getName());

        // Update profile fields if provided
        boolean hasProfileUpdate = body.containsKey("fullName") || body.containsKey("email") || body.containsKey("phone");
        if (hasProfileUpdate) {
            user = userService.updateUser(
                    user.getId(),
                    body.get("fullName"),
                    body.get("email"),
                    body.get("phone")
            );
        }

        // Change password if both current and new password are provided
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (newPassword != null && !newPassword.isEmpty()) {
            try {
                userService.changePassword(user.getId(), currentPassword, newPassword);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
        }

        // Return the updated user profile
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("role", user.getRole().name());
        result.put("enabled", user.isEnabled());
        return ResponseEntity.ok(result);
    }
}
