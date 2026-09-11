package com.sportscamp.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Optional performance evaluation of a player for a specific session.
 * Scores are 1–10 integers. Only captains / admins can create these.
 */
@Entity
@Table(name = "player_evaluations",
       uniqueConstraints = @UniqueConstraint(name = "uk_eval_player_session",
               columnNames = {"player_id", "session_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerEvaluation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "eval_seq")
    @SequenceGenerator(name = "eval_seq", sequenceName = "eval_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    /** Technical skills: 1–10 */
    @Column(name = "technical_score")
    private Integer technicalScore;

    /** Physical fitness: 1–10 */
    @Column(name = "physical_score")
    private Integer physicalScore;

    /** Team-play / attitude: 1–10 */
    @Column(name = "attitude_score")
    private Integer attitudeScore;

    @Column(length = 1000)
    private String comments;

    @Column(name = "evaluation_date")
    private LocalDate evaluationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluated_by")
    private User evaluatedBy;
}
