package com.sportscamp.attendance.dto;

import java.util.List;

/**
 * Unified player profile. {@code isCaptain} is true when the player captains a sport;
 * {@code captainOfSport} is then the sport they lead, otherwise {@code null}.
 */
public record PlayerProfileDTO(
        Long id,
        String fullName,
        String email,
        String phone,
        String department,
        boolean isCaptain,
        SportInfo captainOfSport,
        List<SportInfo> sports
) {
    public record SportInfo(Long id, String name) {
    }
}