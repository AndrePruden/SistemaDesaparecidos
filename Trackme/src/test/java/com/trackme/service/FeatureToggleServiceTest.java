package com.trackme.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FeatureToggleServiceTest {

    @Test
    void testConstructor_WithDefaultValues() {
        FeatureToggleService service = new FeatureToggleService(false, false);

        assertFalse(service.isCreateReportsEnabled());
        assertFalse(service.isCreateSightingsEnabled());

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertEquals(2, allToggles.size());
        assertFalse(allToggles.get("create-reports"));
        assertFalse(allToggles.get("create-sightings"));
    }

    @Test
    void testConstructor_WithEnabledFeatures() {
        FeatureToggleService service = new FeatureToggleService(true, true);

        assertTrue(service.isCreateReportsEnabled());
        assertTrue(service.isCreateSightingsEnabled());

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertEquals(2, allToggles.size());
        assertTrue(allToggles.get("create-reports"));
        assertTrue(allToggles.get("create-sightings"));
    }

    @Test
    void testConstructor_WithMixedFeatures() {
        FeatureToggleService service = new FeatureToggleService(true, false);

        assertTrue(service.isCreateReportsEnabled());
        assertFalse(service.isCreateSightingsEnabled());

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertEquals(2, allToggles.size());
        assertTrue(allToggles.get("create-reports"));
        assertFalse(allToggles.get("create-sightings"));
    }

    @Test
    void testIsCreateReportsEnabled_ReturnsCorrectValue() {
        FeatureToggleService serviceEnabled = new FeatureToggleService(true, false);
        FeatureToggleService serviceDisabled = new FeatureToggleService(false, false);

        assertTrue(serviceEnabled.isCreateReportsEnabled());
        assertFalse(serviceDisabled.isCreateReportsEnabled());
    }

    @Test
    void testIsCreateSightingsEnabled_ReturnsCorrectValue() {
        FeatureToggleService serviceEnabled = new FeatureToggleService(false, true);
        FeatureToggleService serviceDisabled = new FeatureToggleService(false, false);

        assertTrue(serviceEnabled.isCreateSightingsEnabled());
        assertFalse(serviceDisabled.isCreateSightingsEnabled());
    }

    @Test
    void testGetAllToggles_ReturnsImmutableCopy() {
        FeatureToggleService service = new FeatureToggleService(true, false);

        Map<String, Boolean> toggles1 = service.getAllToggles();
        Map<String, Boolean> toggles2 = service.getAllToggles();

        assertNotSame(toggles1, toggles2); // Diferentes instancias
        assertEquals(toggles1, toggles2); // Mismo contenido

        toggles1.put("test-feature", true);
        assertFalse(service.getAllToggles().containsKey("test-feature"));
    }

    @Test
    void testSetFeatureEnabled_UpdatesExistingFeature() {
        FeatureToggleService service = new FeatureToggleService(false, false);
        assertFalse(service.isCreateReportsEnabled());

        service.setFeatureEnabled("create-reports", true);

        assertTrue(service.isCreateReportsEnabled());
        assertTrue(service.getAllToggles().get("create-reports"));
    }

    @Test
    void testSetFeatureEnabled_AddsNewFeature() {
        FeatureToggleService service = new FeatureToggleService(false, false);

        service.setFeatureEnabled("new-feature", true);

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertEquals(3, allToggles.size());
        assertTrue(allToggles.get("new-feature"));
        assertFalse(allToggles.get("create-reports"));
        assertFalse(allToggles.get("create-sightings"));
    }

    @Test
    void testSetFeatureEnabled_DisablesFeature() {
        FeatureToggleService service = new FeatureToggleService(true, true);
        assertTrue(service.isCreateSightingsEnabled());

        service.setFeatureEnabled("create-sightings", false);

        assertFalse(service.isCreateSightingsEnabled());
        assertFalse(service.getAllToggles().get("create-sightings"));
        assertTrue(service.isCreateReportsEnabled());
    }

    @Test
    void testSetFeatureEnabled_WithNullFeatureName() {
        FeatureToggleService service = new FeatureToggleService(false, false);

        service.setFeatureEnabled(null, true);

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertTrue(allToggles.containsKey(null));
        assertTrue(allToggles.get(null));
    }

    @Test
    void testSetFeatureEnabled_MultipleUpdates() {
        FeatureToggleService service = new FeatureToggleService(false, false);

        service.setFeatureEnabled("create-reports", true);
        service.setFeatureEnabled("create-sightings", true);
        service.setFeatureEnabled("create-reports", false);

        assertFalse(service.isCreateReportsEnabled());
        assertTrue(service.isCreateSightingsEnabled());

        Map<String, Boolean> allToggles = service.getAllToggles();
        assertFalse(allToggles.get("create-reports"));
        assertTrue(allToggles.get("create-sightings"));
    }

    @Test
    void testFeatureToggleConsistency() {
        FeatureToggleService service = new FeatureToggleService(true, false);

        boolean reportsEnabled = service.isCreateReportsEnabled();
        boolean sightingsEnabled = service.isCreateSightingsEnabled();
        Map<String, Boolean> allToggles = service.getAllToggles();

        assertEquals(reportsEnabled, allToggles.get("create-reports"));
        assertEquals(sightingsEnabled, allToggles.get("create-sightings"));
    }
}