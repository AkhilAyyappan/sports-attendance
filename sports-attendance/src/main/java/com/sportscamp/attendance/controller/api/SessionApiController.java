package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.TrainingSession;
import com.sportscamp.attendance.service.TrainingSessionService;
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
public class SessionApiController {

    private final TrainingSessionService sessionService;

    /** GET /api/sessions — all sessions across all sports */
    @GetMapping("/sessions")
    public List<TrainingSession> listAll() {
        return sessionService.findAll();
    }

    /** GET /api/sports/{sportId}/sessions */
    @GetMapping("/sports/{sportId}/sessions")
    public List<TrainingSession> listBySport(@PathVariable Long sportId) {
        return sessionService.findBySport(sportId);
    }

    /** GET /api/sessions/{id} */
    @GetMapping("/sessions/{id}")
    public TrainingSession getById(@PathVariable Long id) {
        return sessionService.findById(id);
    }

    /**
     * POST /api/sports/{sportId}/sessions
     * body: { "title":"Morning Practice", "sessionDate":"2025-06-05",
     *         "startTime":"07:00", "endTime":"09:00", "notes":"Drills" }
     */
    @PostMapping("/sports/{sportId}/sessions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAPTAIN')")
    public ResponseEntity<TrainingSession> create(@PathVariable Long sportId,
                                                  @RequestBody Map<String, Object> body) {
        TrainingSession session = buildSession(body);
        TrainingSession saved = sessionService.createForSport(session, sportId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** PUT /api/sessions/{id} */
    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAPTAIN')")
    public TrainingSession update(@PathVariable Long id,
                                  @RequestBody TrainingSession session) {
        return sessionService.update(id, session);
    }

    /** PATCH /api/sessions/{id}/status  body: {"status":"COMPLETED"} */
    @PatchMapping("/sessions/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAPTAIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        sessionService.updateStatus(id, TrainingSession.SessionStatus.valueOf(body.get("status")));
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/sessions/{id} */
    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAPTAIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSession(@PathVariable Long id) {
        sessionService.delete(id);
    }

    private TrainingSession buildSession(Map<String, Object> body) {
        TrainingSession s = new TrainingSession();
        s.setTitle((String) body.get("title"));
        if (body.get("sessionDate") != null)
            s.setSessionDate(java.time.LocalDate.parse(body.get("sessionDate").toString()));
        if (body.get("startTime") != null)
            s.setStartTime(java.time.LocalTime.parse(body.get("startTime").toString()));
        if (body.get("endTime") != null)
            s.setEndTime(java.time.LocalTime.parse(body.get("endTime").toString()));
        if (body.get("notes") != null)
            s.setNotes(body.get("notes").toString());
        return s;
    }
}
