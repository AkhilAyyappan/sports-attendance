package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Attendance.AttendanceStatus;
import com.sportscamp.attendance.repository.AttendanceRepository;
import com.sportscamp.attendance.service.AttendanceService;
import com.sportscamp.attendance.service.PlayerService;
import com.sportscamp.attendance.service.TrainingSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceApiControllerTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private PlayerService playerService;

    @Mock
    private TrainingSessionService trainingSessionService;

    private AttendanceService attendanceService;

    @BeforeEach
    void setUp() {
        attendanceService = new AttendanceService(attendanceRepository, playerService, trainingSessionService);
    }

    @Test
    void countByPlayerIdAndStatusDelegatesToRepository() {
        when(attendanceRepository.countByPlayerIdAndStatus(7L, AttendanceStatus.PRESENT)).thenReturn(4L);

        long actual = attendanceService.countByPlayerIdAndStatus(7L, AttendanceStatus.PRESENT);

        assertEquals(4L, actual);
        verify(attendanceRepository).countByPlayerIdAndStatus(7L, AttendanceStatus.PRESENT);
    }

    @Test
    void countTotalSessionsByPlayerDelegatesToRepository() {
        when(attendanceRepository.countByPlayerId(7L)).thenReturn(8L);

        long actual = attendanceService.countTotalSessionsByPlayer(7L);

        assertEquals(8L, actual);
        verify(attendanceRepository).countByPlayerId(7L);
    }
}
