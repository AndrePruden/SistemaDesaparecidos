package com.trackme.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FeatureToggleService {

    private static final Logger logger = LoggerFactory.getLogger(FeatureToggleService.class);

    private final Map<String, Boolean> featureToggles = new HashMap<>();

    public FeatureToggleService(
            @Value("${feature.create-reports.enabled:false}") boolean createReportsEnabled,
            @Value("${feature.create-sightings.enabled:false}") boolean createSightingsEnabled
    ) {
        featureToggles.put("create-reports", createReportsEnabled);
        featureToggles.put("create-sightings", createSightingsEnabled);

        logger.info("Inicializado feature toggle: 'create-reports' = {}", createReportsEnabled);
        logger.info("Inicializado feature toggle: 'create-sightings' = {}", createSightingsEnabled);
    }

    public boolean isCreateReportsEnabled() {
        boolean estado = featureToggles.getOrDefault("create-reports", false);
        logger.debug("Consultado estado de 'create-reports': {}", estado);
        return estado;
    }

    public boolean isCreateSightingsEnabled() {
        boolean estado = featureToggles.getOrDefault("create-sightings", false);
        logger.debug("Consultado estado de 'create-sightings': {}", estado);
        return estado;
    }

    public Map<String, Boolean> getAllToggles() {
        logger.debug("Obteniendo todos los feature toggles");
        return new HashMap<>(featureToggles);
    }

    public void setFeatureEnabled(String featureName, boolean enabled) {
        featureToggles.put(featureName, enabled);
        logger.info("Feature toggle actualizado: '{}' = {}", featureName, enabled);
    }
}