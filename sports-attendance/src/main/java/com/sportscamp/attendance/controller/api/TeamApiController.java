package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Team;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.TeamService;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TeamApiController {

    private final TeamService teamService;
    private final UserService userService;

    /** GET /api/camps/{campId}/teams */
    @GetMapping("/camps/{campId}/teams")
    public List<Team> listByCamp(@PathVariable Long campId) {
        return teamService.findByCamp(campId);
    }

    /** GET /api/teams/{id} */
    @GetMapping("/teams/{id}")
    public Team getById(@PathVariable Long id) {
        return teamService.findById(id);
    }

    /** POST /api/camps/{campId}/teams  body: {"name":"...", "sportId":1} */
    @PostMapping("/camps/{campId}/teams")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Team> create(@PathVariable Long campId,
                                       @RequestBody Map<String, Object> body) {
        String name    = (String) body.get("name");
        Long   sportId = Long.valueOf(body.get("sportId").toString());
        Team team = teamService.createTeam(name, campId, sportId);
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    /** PATCH /api/teams/{id}  body: {"name":"...", "active": true} */
    @PatchMapping("/teams/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Team update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String  name   = (String) body.getOrDefault("name", teamService.findById(id).getName());
        boolean active = (Boolean) body.getOrDefault("active", true);
        return teamService.update(id, name, active);
    }

    /** POST /api/teams/{teamId}/captain  body: {"captainId": 2} */
    @PostMapping("/teams/{teamId}/captain")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Team assignCaptain(@PathVariable Long teamId,
                              @RequestBody Map<String, Object> body) {
        Long captainId = Long.valueOf(body.get("captainId").toString());
        User captain = userService.findById(captainId);
        return teamService.assignCaptain(teamId, captain);
    }
}
