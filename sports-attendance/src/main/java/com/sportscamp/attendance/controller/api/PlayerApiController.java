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

    /** GET /api/sports/{sportId}/players */
    @GetMapping("/sports/{sportId}/players")
    public List<Player> listBySport(@PathVariable Long sportId) {
        return playerService.findAllBySport(sportId);
    }

    /** GET /api/players/{id} */
    @GetMapping("/players/{id}")
    public Player getById(@PathVariable Long id) {
        return playerService.findById(id);
    }

    /** POST /api/sports/{sportId}/players */
    @PostMapping("/sports/{sportId}/players")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public ResponseEntity<Player> addPlayer(@PathVariable Long sportId,
                                            @RequestBody Player player) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerService.addPlayer(player, sportId));
    }

    /** PUT /api/players/{id} */
    @PutMapping("/players/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public Player update(@PathVariable Long id, @RequestBody Player player) {
        return playerService.update(id, player);
    }

    /** DELETE /api/players/{id} */
    @DeleteMapping("/players/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlayer(@PathVariable Long id) {
        playerService.delete(id);
    }
}
