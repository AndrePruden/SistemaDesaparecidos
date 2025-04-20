package com.trackme.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Value;
import static org.mockito.Mockito.*;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FeatureToggleServiceTest {

    @InjectMocks
    private FeatureToggleService featureToggleService;

    @Mock
    @Value("${feature.create-reports.enabled:false}")
    private boolean createReportsEnabled;

    @BeforeEach
    void setUp() {
        createReportsEnabled = false;
    }

    @Test
    void constructor_deberiaInicializarConValoresPorDefecto() {
        featureToggleService = new FeatureToggleService(createReportsEnabled);
        Map<String, Boolean> toggles = featureToggleService.getAllToggles();
        assertTrue(toggles.containsKey("create-reports"));
        assertEquals(false, toggles.get("create-reports"));
    }

    @Test
    void isCreateReportsEnabled_deberiaRetornarValorCorrecto() {
        featureToggleService = new FeatureToggleService(createReportsEnabled);
        assertFalse(featureToggleService.isCreateReportsEnabled());
    }

    @Test
    void setFeatureEnabled_deberiaActualizarElEstadoDeUnFeature() {
        featureToggleService = new FeatureToggleService(false);
        assertFalse(featureToggleService.isCreateReportsEnabled());
        featureToggleService.setFeatureEnabled("create-reports", true);
        assertTrue(featureToggleService.isCreateReportsEnabled());
    }

    @Test
    void getAllToggles_deberiaRetornarElMapaDeToggles() {
        featureToggleService = new FeatureToggleService(createReportsEnabled);
        Map<String, Boolean> toggles = featureToggleService.getAllToggles();
        assertNotNull(toggles);
        assertEquals(1, toggles.size());
    }
}
