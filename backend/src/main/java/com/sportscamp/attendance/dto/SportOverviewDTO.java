package com.sportscamp.attendance.dto;

import java.util.List;

/**
 * Admin overview row for an active sport: roster count plus the assigned player-captains.
 */
public record SportOverviewDTO(
        Long id,
        String name,
        String description,
        boolean active,
        long totalPlayers,
        List<CaptainInfo> captains
) {
    public record CaptainInfo(Long id, String fullName, String email) {
    }
}