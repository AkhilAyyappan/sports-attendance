package com.sportscamp.attendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A sports training camp.
 * Top of the hierarchy: Camp → Sport → Team → Player → Session → Attendance.
 */
@Entity
@Table(name = "camps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camp extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "camp_seq")
    @SequenceGenerator(name = "camp_seq", sequenceName = "camp_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CampStatus status = CampStatus.UPCOMING;

    @JsonIgnore
    @OneToMany(mappedBy = "camp", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Team> teams = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "camp", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TrainingSession> trainingSessions = new ArrayList<>();

    public enum CampStatus {
        UPCOMING, ACTIVE, COMPLETED, CANCELLED
    }
}
