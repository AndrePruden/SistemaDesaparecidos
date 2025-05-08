package com.trackme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TrackmeApplication {
    public static void main(String[] args) {
        SpringApplication.run(TrackmeApplication.class, args);
    }
}
