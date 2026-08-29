package com.sportscamp.attendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * A sport program (e.g. Football, Cricket, Basketball, Athletics).
 * Each sport directly has an assigned captain/coach, players, and training sessions.
 * Multiple sports can be managed by the same captain.
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
     * Assigned Captain/Coach for this sport program.
     * Many sports can have the same captain.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "captain_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private User captain;

    @JsonIgnore
    @OneToMany(mappedBy = "sport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Player> players = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "sport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TrainingSession> trainingSessions = new ArrayList<>();
}
