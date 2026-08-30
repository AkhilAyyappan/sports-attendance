package com.sportscamp.attendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * A sport program (e.g. Football, Cricket, Basketball, Athletics).
 * Each sport can have up to 3 captains who manage players, sessions, and attendance.
 */
@Entity
@Table(name = "sports",
       uniqueConstraints = @UniqueConstraint(name = "uk_sport_name", columnNames = "name"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sport_seq")
    @SequenceGenerator(name = "sport_seq", sequenceName = "sport_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Captains/coaches for this sport. Maximum of 3 captains allowed.
     * Many captains can be assigned to many sports.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "sport_captains",
        joinColumns = @JoinColumn(name = "sport_id"),
        inverseJoinColumns = @JoinColumn(name = "captain_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @Builder.Default
    private List<User> captains = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "sport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Player> players = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "sport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TrainingSession> trainingSessions = new ArrayList<>();

    /**
     * Check if a user is one of the captains of this sport.
     */
    public boolean hasCaptain(User user) {
        if (user == null) return false;
        return captains != null && captains.stream().anyMatch(c -> c.getId().equals(user.getId()));
    }

    /**
     * Get the first captain, or null if no captains assigned.
     */
    public User getPrimaryCaptain() {
        if (captains == null || captains.isEmpty()) return null;
        return captains.get(0);
    }
}
