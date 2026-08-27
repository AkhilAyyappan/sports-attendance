package com.sportscamp.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SportsAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SportsAttendanceApplication.class, args);
    }
}
