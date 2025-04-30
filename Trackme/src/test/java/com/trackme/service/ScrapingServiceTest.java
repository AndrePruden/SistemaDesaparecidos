package com.trackme.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ScrapingServiceTest {
    @Autowired
    private ScrapingService scrapingService;

    @Test
    public void testVerTodosLosNombresDesaparecidos() {
        assertNotNull(scrapingService);
        scrapingService.verTodosLosNombresDesaparecidos();
    }

}