package com.trackme.controller;

import com.trackme.service.FeatureToggleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/config")
@CrossOrigin(origins = "http://localhost:4200")
public class FeatureToggleController {
    @Autowired
    private FeatureToggleService featureToggleService;

    @GetMapping("/feature-flags")
    public Map<String, Boolean> getFeatureToggles() {
        return featureToggleService.getAllToggles();
    }

    @GetMapping("/feature-toggles/{featureName}")
    public boolean getFeatureFlag(@PathVariable String featureName) {
        return switch (featureName) {
            case "create-reports" -> featureToggleService.isCreateReportsEnabled();
            case "create-sightings" -> featureToggleService.isCreateSightingsEnabled();
            default -> throw new IllegalArgumentException("Feature toggle no encontrado: " + featureName);
        };
    }

    @GetMapping("/feature-toggles/can-create-reports")
    public boolean canCreateReports(@RequestParam(value = "isLoggedIn", defaultValue = "false") boolean isLoggedIn) {
        if (isLoggedIn) {
            return true;
        }
        return featureToggleService.isCreateReportsEnabled();
    }
}