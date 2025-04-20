package com.trackme.service;
<<<<<<< Updated upstream

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FeatureToggleService {
    private final Map<String, Boolean> features = new ConcurrentHashMap<>();

    public FeatureToggleService() {
        features.put("reportes", true); // Puedes poner false para deshabilitar
    }

    public boolean isFeatureEnabled(String feature) {
        return features.getOrDefault(feature, false);
    }

    public void setFeatureEnabled(String feature, boolean enabled) {
        features.put(feature, enabled);
    }

    public Map<String, Boolean> getAllToggles() {
        return features;
    }
}
=======
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FeatureToggleService {

    private final Map<String, Boolean> featureToggles = new HashMap<>();

    public FeatureToggleService(@Value("${feature.create-reports.enabled:false}") boolean createReportsEnabled) {
        featureToggles.put("create-reports", createReportsEnabled);
    }

    public boolean isCreateReportsEnabled() {
        return featureToggles.getOrDefault("create-reports", false);
    }

    public Map<String, Boolean> getAllToggles() {
        return featureToggles;
    }

    public void setFeatureEnabled(String featureName, boolean enabled) {
        featureToggles.put(featureName, enabled);
    }
}
>>>>>>> Stashed changes
