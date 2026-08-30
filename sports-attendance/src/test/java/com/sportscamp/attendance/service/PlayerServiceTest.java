package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlayerServiceTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private SportService sportService;

    private PlayerService playerService;

    @BeforeEach
    void setUp() {
        playerService = new PlayerService(playerRepository, sportService);
    }

    @Test
    void addPlayerAllowsSameJerseyNumberInSameSport() {
        Sport sport = new Sport();
        sport.setId(4L);

        Player player = new Player();
        player.setJerseyNumber(10);
        player.setFullName("Test Player");

        when(sportService.findById(4L)).thenReturn(sport);
        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> playerService.addPlayer(player, 4L));
    }

    @Test
    void findActiveBySportUsesCorrectRepositoryMethod() {
        Player player = new Player();
        player.setId(7L);
        player.setFullName("Roster Player");

        when(playerRepository.findBySport_IdAndActiveTrue(4L)).thenReturn(java.util.List.of(player));

        assertEquals(1, playerService.findActiveBySport(4L).size());
        verify(playerRepository).findBySport_IdAndActiveTrue(4L);
    }
}
