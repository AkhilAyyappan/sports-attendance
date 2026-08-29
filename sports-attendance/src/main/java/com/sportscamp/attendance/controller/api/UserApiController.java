package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.DuplicateResourceException;
import com.sportscamp.attendance.service.SportService;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class UserApiController {

    private final UserService userService;
    private final SportService sportService;

    /** GET /api/users/captains */
    @GetMapping("/captains")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Map<String, Object>> listCaptains() {
        List<User> captains = userService.findCaptains();
        return captains.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("username", c.getUsername());
            map.put("fullName", c.getFullName());
            map.put("email", c.getEmail());
            map.put("phone", c.getPhone());
            map.put("role", c.getRole().name());
            map.put("enabled", c.isEnabled());
            map.put("active", c.isEnabled());

            List<Sport> assignedSports = sportService.findByCaptainId(c.getId());
            List<Map<String, Object>> sportsList = assignedSports.stream()
                    .map(s -> Map.<String, Object>of("id", s.getId(), "name", s.getName()))
                    .toList();
            map.put("sports", sportsList);
            if (!assignedSports.isEmpty()) {
                map.put("sportId", assignedSports.get(0).getId());
                map.put("sportName", assignedSports.stream().map(Sport::getName).collect(Collectors.joining(", ")));
            } else {
                map.put("sportName", null);
            }
            return map;
        }).toList();
    }

    /** GET /api/users/{id} */
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }

    /** POST /api/users */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        if (body == null || !body.containsKey("username") || body.get("username") == null || body.get("username").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        if (!body.containsKey("password") || body.get("password") == null || body.get("password").isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        if (!body.containsKey("fullName") || body.get("fullName") == null || body.get("fullName").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full Name is required"));
        }
        try {
            User user = userService.createUser(
                    body.get("username").trim(),
                    body.get("password"),
                    body.get("fullName").trim(),
                    body.get("email"),
                    body.get("phone"),
                    User.Role.valueOf(body.getOrDefault("role", "ROLE_CAPTAIN"))
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /** PATCH /api/users/{id}/password  body: {"newPassword":"secret"} */
    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        userService.resetPassword(id, body.get("newPassword"));
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/users/{id}/toggle  — enable / disable */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        User user = userService.findById(id);
        userService.setEnabled(id, !user.isEnabled());
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/users/{id} */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
