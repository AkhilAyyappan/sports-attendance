package com.sportscamp.attendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * A team within a camp.
 * A team belongs to one camp and one sport.
 * A captain (User) manages one team at a time.
 *
 * IMPORTANT: When a captain changes, we update captain here.
 * Historical attendance records keep their own "markedBy" reference
 * so history is never rewritten.
 */
@Entity
@Table(name = "teams",
       uniqueConstraints = @UniqueConstraint(name = "uk_team_name_camp", columnNames = {"name", "camp_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "team_seq")
    @SequenceGenerator(name = "team_seq", sequenceName = "team_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camp_id", nullable = false)
    @JsonIgnoreProperties({"teams","trainingSessions","hibernateLazyInitializer"})
    private Camp camp;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    @JsonIgnoreProperties({"teams","hibernateLazyInitializer"})
    private Sport sport;

    /**
     * Current active captain.
     * Nullable — a team can exist temporarily without a captain.
     * When captain changes, this FK is updated; historical records are untouched.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "captain_id")
    @JsonIgnoreProperties({"team","hibernateLazyInitializer"})
    private User captain;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @JsonIgnore
    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Player> players = new ArrayList<>();
}
