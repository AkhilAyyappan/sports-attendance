package com.sportscamp.attendance.controller;

import com.sportscamp.attendance.entity.*;
import com.sportscamp.attendance.entity.Attendance.AttendanceStatus;
import com.sportscamp.attendance.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/captain")
@PreAuthorize("hasAuthority('ROLE_CAPTAIN')")
@RequiredArgsConstructor
public class CaptainController {

    private final UserService userService;
    private final TeamService teamService;
    private final PlayerService playerService;
    private final TrainingSessionService sessionService;
    private final AttendanceService attendanceService;

    private User currentUser(Authentication auth) {
        return userService.findByUsername(auth.getName());
    }

    @GetMapping("/dashboard")
    public String dashboard(Authentication auth, Model model) {
        User me = currentUser(auth);
        List<Team> teams = teamService.findByCaptainId(me.getId());
        model.addAttribute("user", me);
        model.addAttribute("teams", teams);
        return "captain/dashboard";
    }

    @GetMapping("/teams/{teamId}/sessions")
    public String sessions(@PathVariable Long teamId, Authentication auth, Model model) {
        Team team = teamService.findById(teamId);
        ensureOwnsTeam(auth, team);
        List<TrainingSession> sessions = sessionService.findForTeam(team.getCamp().getId(), teamId);
        model.addAttribute("team", team);
        model.addAttribute("sessions", sessions);
        return "captain/sessions";
    }

    @GetMapping("/sessions/{sessionId}/attendance")
    public String attendanceForm(@PathVariable Long sessionId, Authentication auth, Model model) {
        TrainingSession session = sessionService.findById(sessionId);
        Long teamId = session.getTeam() != null
                ? session.getTeam().getId()
                : teamService.findByCaptainId(currentUser(auth).getId()).stream()
                      .filter(t -> t.getCamp().getId().equals(session.getCamp().getId()))
                      .map(Team::getId)
                      .findFirst().orElseThrow();

        List<Player> players = playerService.findActiveByTeam(teamId);
        List<Attendance> existing = attendanceService.findByTeamAndSession(teamId, sessionId);

        // Build a map playerId → current status for pre-filling the form
        Map<Long, AttendanceStatus> statusMap = new HashMap<>();
        existing.forEach(a -> statusMap.put(a.getPlayer().getId(), a.getStatus()));

        model.addAttribute("session", session);
        model.addAttribute("players", players);
        model.addAttribute("statusMap", statusMap);
        model.addAttribute("statuses", AttendanceStatus.values());
        return "captain/attendance-form";
    }

    @PostMapping("/sessions/{sessionId}/attendance")
    public String saveAttendance(@PathVariable Long sessionId,
                                 @RequestParam Map<String, String> params,
                                 Authentication auth,
                                 RedirectAttributes ra) {
        User me = currentUser(auth);
        Map<Long, AttendanceStatus> statusMap = new HashMap<>();

        // Parameters arrive as "status_<playerId>" → status value
        params.forEach((key, value) -> {
            if (key.startsWith("status_")) {
                Long playerId = Long.parseLong(key.substring(7));
                statusMap.put(playerId, AttendanceStatus.valueOf(value));
            }
        });

        attendanceService.saveAttendance(sessionId, statusMap, me);
        ra.addFlashAttribute("success", "Attendance saved.");

        TrainingSession session = sessionService.findById(sessionId);
        Long teamId = session.getTeam() != null
                ? session.getTeam().getId()
                : teamService.findByCaptainId(me.getId()).stream()
                      .filter(t -> t.getCamp().getId().equals(session.getCamp().getId()))
                      .map(Team::getId)
                      .findFirst().orElseThrow();
        return "redirect:/captain/teams/" + teamId + "/sessions";
    }

    @GetMapping("/teams/{teamId}/players")
    public String players(@PathVariable Long teamId, Authentication auth, Model model) {
        Team team = teamService.findById(teamId);
        ensureOwnsTeam(auth, team);
        model.addAttribute("team", team);
        model.addAttribute("players", playerService.findActiveByTeam(teamId));
        return "captain/players";
    }

    @GetMapping("/teams/{teamId}/report")
    public String report(@PathVariable Long teamId, Authentication auth, Model model) {
        Team team = teamService.findById(teamId);
        ensureOwnsTeam(auth, team);
        List<Player> players = playerService.findActiveByTeam(teamId);
        List<TrainingSession> sessions = sessionService.findForTeam(team.getCamp().getId(), teamId);

        // Build attendance summary: player → List of statuses per session
        Map<Long, Map<Long, AttendanceStatus>> grid = new HashMap<>();
        for (Player p : players) {
            Map<Long, AttendanceStatus> row = new HashMap<>();
            sessions.forEach(s -> row.put(s.getId(), AttendanceStatus.ABSENT));
            grid.put(p.getId(), row);
        }
        attendanceService.findByTeamAndSession(teamId, -1L); // warm up
        sessions.forEach(s ->
            attendanceService.findByTeamAndSession(teamId, s.getId())
                .forEach(a -> grid.computeIfAbsent(a.getPlayer().getId(), k -> new HashMap<>())
                    .put(a.getSession().getId(), a.getStatus()))
        );

        model.addAttribute("team", team);
        model.addAttribute("players", players);
        model.addAttribute("sessions", sessions);
        model.addAttribute("grid", grid);
        return "captain/report";
    }

    /** Guard: throw 403 if the logged-in captain does not own this team. */
    private void ensureOwnsTeam(Authentication auth, Team team) {
        if (team.getCaptain() == null ||
                !team.getCaptain().getUsername().equals(auth.getName())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not manage team: " + team.getId());
        }
    }
}
