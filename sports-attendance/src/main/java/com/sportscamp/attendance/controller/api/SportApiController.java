package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.service.SportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sports")
@RequiredArgsConstructor
public class SportApiController {

    private final SportService sportService;

    @GetMapping
    public List<Sport> listAll() {
        return sportService.findAll();
    }

    @GetMapping("/active")
    public List<Sport> listActive() {
        return sportService.findAllActive();
    }

    @GetMapping("/{id}")
    public Sport getById(@PathVariable Long id) {
        return sportService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Sport> create(@RequestBody Sport sport) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sportService.save(sport));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Sport update(@PathVariable Long id, @RequestBody Sport sport) {
        return sportService.update(id, sport);
    }
}
