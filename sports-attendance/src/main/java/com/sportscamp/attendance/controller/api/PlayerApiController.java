package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.service.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlayerApiController {

    private final PlayerService playerService;

    /** GET /api/teams/{teamId}/players */
    @GetMapping("/teams/{teamId}/players")
    public List<Player> listByTeam(@PathVariable Long teamId) {
        return playerService.findActiveByTeam(teamId);
    }

    /** GET /api/players/{id} */
    @GetMapping("/players/{id}")
    public Player getById(@PathVariable Long id) {
        return playerService.findById(id);
    }

    /** POST /api/teams/{teamId}/players */
    @PostMapping("/teams/{teamId}/players")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public ResponseEntity<Player> addPlayer(@PathVariable Long teamId,
                                            @RequestBody Player player) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerService.addPlayer(player, teamId));
    }

    /** PUT /api/players/{id} */
    @PutMapping("/players/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public Player update(@PathVariable Long id, @RequestBody Player player) {
        return playerService.update(id, player);
    }

    /** DELETE /api/players/{id}  — soft deactivate */
    @DeleteMapping("/players/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        playerService.deactivate(id);
    }
}
