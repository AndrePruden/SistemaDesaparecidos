package com.trackme.service;

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
