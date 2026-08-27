package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Camp;
import com.sportscamp.attendance.service.CampService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camps")
@RequiredArgsConstructor
public class CampApiController {

    private final CampService campService;

    @GetMapping
    public List<Camp> listAll() {
        return campService.findAll();
    }

    @GetMapping("/{id}")
    public Camp getById(@PathVariable Long id) {
        return campService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Camp> create(@RequestBody Camp camp) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campService.save(camp));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Camp update(@PathVariable Long id, @RequestBody Camp camp) {
        return campService.update(id, camp);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        campService.delete(id);
    }
}
