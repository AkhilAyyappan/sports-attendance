package com.sportscamp.attendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Attendance record linking a Player to a TrainingSession.
 * markedBy captures which captain/admin recorded the attendance,
 * preserving history even if the captain later changes.
 */
@Entity
@Table(name = "attendances",
       uniqueConstraints = @UniqueConstraint(name = "uk_attendance_player_session",
               columnNames = {"player_id", "session_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "attendance_seq")
    @SequenceGenerator(name = "attendance_seq", sequenceName = "attendance_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    @JsonIgnoreProperties({"attendances","evaluations","team","hibernateLazyInitializer"})
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnoreProperties({"attendances","camp","team","hibernateLazyInitializer"})
    private TrainingSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.ABSENT;

    /**
     * Who recorded this attendance entry.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by")
    @JsonIgnoreProperties({"team","hibernateLazyInitializer"})
    private User markedBy;

    @Column(name = "marked_at")
    private LocalDateTime markedAt;

    @Column(length = 500)
    private String remarks;

    @com.fasterxml.jackson.annotation.JsonProperty("playerId")
    public Long getPlayerId() {
        return player != null ? player.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("sessionId")
    public Long getSessionId() {
        return session != null ? session.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("playerFullName")
    public String getPlayerFullName() {
        return player != null ? player.getFullName() : null;
    }

    public enum AttendanceStatus {
        PRESENT,
        ABSENT,
        LATE,
        EXCUSED
    }
}
