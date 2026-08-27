package com.sportscamp.attendance.controller;

import com.sportscamp.attendance.entity.*;
import com.sportscamp.attendance.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final CampService campService;
    private final SportService sportService;
    private final TeamService teamService;
    private final UserService userService;
    private final TrainingSessionService sessionService;
    private final PlayerService playerService;

    // ---- Camps ----

    @GetMapping("/camps")
    public String listCamps(Model model) {
        model.addAttribute("camps", campService.findAll());
        model.addAttribute("newCamp", new Camp());
        return "admin/camps";
    }

    @PostMapping("/camps")
    public String createCamp(@ModelAttribute("newCamp") Camp camp,
                             RedirectAttributes ra) {
        campService.save(camp);
        ra.addFlashAttribute("success", "Camp created successfully.");
        return "redirect:/admin/camps";
    }

    @GetMapping("/camps/{id}/edit")
    public String editCampForm(@PathVariable Long id, Model model) {
        model.addAttribute("camp", campService.findById(id));
        return "admin/camp-edit";
    }

    @PostMapping("/camps/{id}/edit")
    public String updateCamp(@PathVariable Long id, @ModelAttribute Camp camp,
                             RedirectAttributes ra) {
        campService.update(id, camp);
        ra.addFlashAttribute("success", "Camp updated.");
        return "redirect:/admin/camps";
    }

    // ---- Sports ----

    @GetMapping("/sports")
    public String listSports(Model model) {
        model.addAttribute("sports", sportService.findAll());
        model.addAttribute("newSport", new Sport());
        return "admin/sports";
    }

    @PostMapping("/sports")
    public String createSport(@ModelAttribute("newSport") Sport sport, RedirectAttributes ra) {
        sportService.save(sport);
        ra.addFlashAttribute("success", "Sport created.");
        return "redirect:/admin/sports";
    }

    // ---- Teams ----

    @GetMapping("/camps/{campId}/teams")
    public String listTeams(@PathVariable Long campId, Model model) {
        model.addAttribute("camp", campService.findById(campId));
        model.addAttribute("teams", teamService.findByCamp(campId));
        model.addAttribute("sports", sportService.findAllActive());
        model.addAttribute("captains", userService.findActiveCaptains());
        return "admin/teams";
    }

    @PostMapping("/camps/{campId}/teams")
    public String createTeam(@PathVariable Long campId,
                             @RequestParam String name,
                             @RequestParam Long sportId,
                             RedirectAttributes ra) {
        teamService.createTeam(name, campId, sportId);
        ra.addFlashAttribute("success", "Team created.");
        return "redirect:/admin/camps/" + campId + "/teams";
    }

    @PostMapping("/teams/{teamId}/captain")
    public String assignCaptain(@PathVariable Long teamId,
                                @RequestParam Long captainId,
                                RedirectAttributes ra) {
        User captain = userService.findById(captainId);
        teamService.assignCaptain(teamId, captain);
        ra.addFlashAttribute("success", "Captain assigned.");
        Team team = teamService.findById(teamId);
        return "redirect:/admin/camps/" + team.getCamp().getId() + "/teams";
    }

    // ---- Sessions ----

    @GetMapping("/camps/{campId}/sessions")
    public String listSessions(@PathVariable Long campId, Model model) {
        model.addAttribute("camp", campService.findById(campId));
        model.addAttribute("sessions", sessionService.findByCamp(campId));
        model.addAttribute("teams", teamService.findActiveByCamp(campId));
        model.addAttribute("newSession", new TrainingSession());
        return "admin/sessions";
    }

    @PostMapping("/camps/{campId}/sessions")
    public String createSession(@PathVariable Long campId,
                                @ModelAttribute TrainingSession session,
                                @RequestParam(required = false) Long teamId,
                                RedirectAttributes ra) {
        if (teamId != null) {
            sessionService.createForTeam(session, campId, teamId);
        } else {
            sessionService.createForCamp(session, campId);
        }
        ra.addFlashAttribute("success", "Session created.");
        return "redirect:/admin/camps/" + campId + "/sessions";
    }

    // ---- Users / Captains ----

    @GetMapping("/users")
    public String listUsers(Model model) {
        model.addAttribute("captains", userService.findCaptains());
        return "admin/users";
    }

    @PostMapping("/users")
    public String createCaptain(@RequestParam String username,
                                @RequestParam String password,
                                @RequestParam String fullName,
                                @RequestParam(required = false) String email,
                                @RequestParam(required = false) String phone,
                                RedirectAttributes ra) {
        userService.createUser(username, password, fullName, email, phone, User.Role.ROLE_CAPTAIN);
        ra.addFlashAttribute("success", "Captain account created.");
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/toggle")
    public String toggleUser(@PathVariable Long id, RedirectAttributes ra) {
        User user = userService.findById(id);
        userService.setEnabled(id, !user.isEnabled());
        ra.addFlashAttribute("success", "User status updated.");
        return "redirect:/admin/users";
    }

    // ---- Players ----

    @GetMapping("/teams/{teamId}/players")
    public String listPlayers(@PathVariable Long teamId, Model model) {
        model.addAttribute("team", teamService.findById(teamId));
        model.addAttribute("players", playerService.findAllByTeam(teamId));
        model.addAttribute("newPlayer", new Player());
        return "admin/players";
    }

    @PostMapping("/teams/{teamId}/players")
    public String addPlayer(@PathVariable Long teamId,
                            @ModelAttribute Player player,
                            RedirectAttributes ra) {
        playerService.addPlayer(player, teamId);
        ra.addFlashAttribute("success", "Player added.");
        return "redirect:/admin/teams/" + teamId + "/players";
    }
}
