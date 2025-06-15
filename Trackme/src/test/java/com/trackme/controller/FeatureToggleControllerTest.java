package com.trackme.controller;

import com.trackme.service.FeatureToggleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FeatureToggleControllerTest {

    @Mock
    private FeatureToggleService featureToggleService;

    @InjectMocks
    private FeatureToggleController featureToggleController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(featureToggleController).build();
    }

    // ============ PRUEBAS PARA GET ALL FEATURE TOGGLES ============

    @Test
    void getFeatureToggles_Success() throws Exception {
        Map<String, Boolean> toggles = new HashMap<>();
        toggles.put("create-reports", true);
        toggles.put("create-sightings", false);

        when(featureToggleService.getAllToggles()).thenReturn(toggles);

        mockMvc.perform(get("/config/feature-flags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.create-reports").value(true))
                .andExpect(jsonPath("$.create-sightings").value(false));
    }

    @Test
    void getFeatureToggles_EmptyMap() throws Exception {
        Map<String, Boolean> toggles = new HashMap<>();
        when(featureToggleService.getAllToggles()).thenReturn(toggles);

        mockMvc.perform(get("/config/feature-flags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ============ PRUEBAS PARA GET SPECIFIC FEATURE TOGGLE ============

    @Test
    void getFeatureFlag_CreateReports_True() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);

        mockMvc.perform(get("/config/feature-toggles/create-reports"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void getFeatureFlag_CreateReports_False() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);

        mockMvc.perform(get("/config/feature-toggles/create-reports"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    @Test
    void getFeatureFlag_CreateSightings_True() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);

        mockMvc.perform(get("/config/feature-toggles/create-sightings"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void getFeatureFlag_CreateSightings_False() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(false);

        mockMvc.perform(get("/config/feature-toggles/create-sightings"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    // ============ PRUEBAS PARA CAN CREATE REPORTS ============

    @Test
    void canCreateReports_UserLoggedIn_True() throws Exception {
        mockMvc.perform(get("/config/feature-toggles/can-create-reports")
                        .param("isLoggedIn", "true"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void canCreateReports_UserNotLoggedIn_FeatureEnabled() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);

        mockMvc.perform(get("/config/feature-toggles/can-create-reports")
                        .param("isLoggedIn", "false"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void canCreateReports_UserNotLoggedIn_FeatureDisabled() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);

        mockMvc.perform(get("/config/feature-toggles/can-create-reports")
                        .param("isLoggedIn", "false"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    @Test
    void canCreateReports_NoParam_DefaultFalse_FeatureEnabled() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);

        mockMvc.perform(get("/config/feature-toggles/can-create-reports"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void canCreateReports_NoParam_DefaultFalse_FeatureDisabled() throws Exception {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);

        mockMvc.perform(get("/config/feature-toggles/can-create-reports"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
}