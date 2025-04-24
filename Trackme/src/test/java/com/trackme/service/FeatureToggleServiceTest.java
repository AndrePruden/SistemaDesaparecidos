package com.trackme.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.InjectMocks;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FeatureToggleServiceTest {

    @InjectMocks
    private FeatureToggleService featureToggleService;

    @BeforeEach
    void setUp() {
        featureToggleService = new FeatureToggleService(false, false);
    }

    @Test
    void constructor_deberiaInicializarConValoresCorrectos() {
        Map<String, Boolean> toggles = featureToggleService.getAllToggles();

        assertTrue(toggles.containsKey("create-reports"));
        assertTrue(toggles.containsKey("create-sightings"));
        assertFalse(toggles.get("create-reports"));
        assertFalse(toggles.get("create-sightings"));
    }

    @Test
    void isCreateReportsEnabled_deberiaRetornarFalsePorDefecto() {
        assertFalse(featureToggleService.isCreateReportsEnabled());
    }

    @Test
    void isCreateSightingsEnabled_deberiaRetornarFalsePorDefecto() {
        assertFalse(featureToggleService.isCreateSightingsEnabled());
    }

    @Test
    void setFeatureEnabled_deberiaActualizarElEstadoDeUnFeature() {
        featureToggleService.setFeatureEnabled("create-reports", true);
        assertTrue(featureToggleService.isCreateReportsEnabled());

        featureToggleService.setFeatureEnabled("create-sightings", true);
        assertTrue(featureToggleService.isCreateSightingsEnabled());
    }

    @Test
    void getAllToggles_deberiaRetornarElMapaDeToggles() {
        Map<String, Boolean> toggles = featureToggleService.getAllToggles();
        assertEquals(2, toggles.size());
        assertTrue(toggles.containsKey("create-reports"));
        assertTrue(toggles.containsKey("create-sightings"));
    }
}