package com.trackme.controller;

import com.trackme.service.FeatureToggleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
<<<<<<< HEAD
@RequestMapping("features")
=======
@RequestMapping("feature")
>>>>>>> 4bbb349 (Fix: configuración de CORS y seguridad)
@CrossOrigin(origins = "http://localhost:4200")
public class FeatureToggleController {
    private final FeatureToggleService featureToggleService;

    public FeatureToggleController(FeatureToggleService featureToggleService) {
        this.featureToggleService = featureToggleService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Boolean>> getAllToggles() {
        return ResponseEntity.ok(featureToggleService.getAllToggles());
    }
    @PutMapping("/{featureName}")
    public ResponseEntity<?> updateToggle(@PathVariable String featureName, @RequestBody boolean enabled) {
        featureToggleService.setFeatureEnabled(featureName, enabled);
        return ResponseEntity.ok("Feature updated");
    }
}
