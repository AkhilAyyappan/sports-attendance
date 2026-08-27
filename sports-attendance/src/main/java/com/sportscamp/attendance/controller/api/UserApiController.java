package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class UserApiController {

    private final UserService userService;

    /** GET /api/users/captains */
    @GetMapping("/captains")
    public List<User> listCaptains() {
        return userService.findCaptains();
    }

    /** GET /api/users/{id} */
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }

    /**
     * POST /api/users
     * body: { "username":"jdoe","password":"pass123","fullName":"John Doe",
     *         "email":"jdoe@x.com","phone":"0000","role":"ROLE_CAPTAIN" }
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> body) {
        User user = userService.createUser(
                body.get("username"),
                body.get("password"),
                body.get("fullName"),
                body.get("email"),
                body.get("phone"),
                User.Role.valueOf(body.getOrDefault("role", "ROLE_CAPTAIN"))
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
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
}
