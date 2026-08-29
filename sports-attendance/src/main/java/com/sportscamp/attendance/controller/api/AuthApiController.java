package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.SportService;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
