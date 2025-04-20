package com.trackme.service;
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
