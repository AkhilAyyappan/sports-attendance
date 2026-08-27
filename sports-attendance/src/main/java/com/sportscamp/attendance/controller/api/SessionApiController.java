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

    /** GET /api/camps/{campId}/sessions */
    @GetMapping("/camps/{campId}/sessions")
    public List<TrainingSession> listByCamp(@PathVariable Long campId) {
        return sessionService.findByCamp(campId);
    }

    /** GET /api/camps/{campId}/sessions?teamId=3 — team-specific + camp-wide sessions */
    @GetMapping(value = "/camps/{campId}/sessions", params = "teamId")
    public List<TrainingSession> listForTeam(@PathVariable Long campId,
                                             @RequestParam Long teamId) {
        return sessionService.findForTeam(campId, teamId);
    }

    /** GET /api/sessions/{id} */
    @GetMapping("/sessions/{id}")
    public TrainingSession getById(@PathVariable Long id) {
        return sessionService.findById(id);
    }

    /**
     * POST /api/camps/{campId}/sessions
     * body: { "title":"Morning Run", "sessionDate":"2025-06-05",
     *         "startTime":"07:00", "endTime":"09:00", "teamId":3 }
     * Omit teamId to create a camp-wide session.
     */
    @PostMapping("/camps/{campId}/sessions")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<TrainingSession> create(@PathVariable Long campId,
                                                  @RequestBody Map<String, Object> body) {
        TrainingSession session = buildSession(body);
        Object teamIdObj = body.get("teamId");
        TrainingSession saved = teamIdObj != null
                ? sessionService.createForTeam(session, campId, Long.valueOf(teamIdObj.toString()))
                : sessionService.createForCamp(session, campId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** PUT /api/sessions/{id} */
    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public TrainingSession update(@PathVariable Long id,
                                  @RequestBody TrainingSession session) {
        return sessionService.update(id, session);
    }

    /** PATCH /api/sessions/{id}/status  body: {"status":"COMPLETED"} */
    @PatchMapping("/sessions/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        sessionService.updateStatus(id, TrainingSession.SessionStatus.valueOf(body.get("status")));
        return ResponseEntity.noContent().build();
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
