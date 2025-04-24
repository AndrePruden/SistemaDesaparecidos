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
}