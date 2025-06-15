package com.trackme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackme.model.Avistamiento;
import com.trackme.service.AvistamientoService;
import com.trackme.service.AvistamientoValidationService;
import com.trackme.service.FeatureToggleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsString;

@ExtendWith(MockitoExtension.class)
class AvistamientoControllerTest {

    @Mock
    private AvistamientoService avistamientoService;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private AvistamientoValidationService avistamientoValidationService;

    @InjectMocks
    private AvistamientoController avistamientoController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private Avistamiento avistamientoTest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(avistamientoController).build();
        objectMapper = new ObjectMapper();

        avistamientoTest = new Avistamiento();
        avistamientoTest.setIdAvistamiento(1L);
        avistamientoTest.setEmailUsuario("test@example.com");
        avistamientoTest.setDescripcion("Descripción de prueba");
        avistamientoTest.setFecha(new Date());
    }

    // ============ PRUEBAS PARA CREAR AVISTAMIENTO ============

    @Test
    void crearAvistamiento_Success() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);
        when(avistamientoValidationService.validarAvistamiento(any(Avistamiento.class))).thenReturn(null);
        when(avistamientoService.crearAvistamiento(any(Avistamiento.class))).thenReturn(avistamientoTest);

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idAvistamiento").value(1L))
                .andExpect(jsonPath("$.emailUsuario").value("test@example.com"));

        verify(avistamientoService).crearAvistamiento(any(Avistamiento.class));
    }

    @Test
    void crearAvistamiento_FeatureToggleDisabled_UserNotLogged() throws Exception {
        Avistamiento avistamientoSinEmail = new Avistamiento();
        avistamientoSinEmail.setDescripcion("Test");
        avistamientoSinEmail.setEmailUsuario(null);

        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(false);

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoSinEmail)))
                .andExpect(status().isForbidden())
                .andExpect(content().string("La creación de avistamientos está deshabilitada para usuarios no logueados."));

        verify(avistamientoService, never()).crearAvistamiento(any());
    }

    @Test
    void crearAvistamiento_FeatureToggleDisabled_UserLogged() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(false);
        when(avistamientoValidationService.validarAvistamiento(any(Avistamiento.class))).thenReturn(null);
        when(avistamientoService.crearAvistamiento(any(Avistamiento.class))).thenReturn(avistamientoTest);

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isOk());

        verify(avistamientoService).crearAvistamiento(any(Avistamiento.class));
    }

    @Test
    void crearAvistamiento_ValidationError() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);
        when(avistamientoValidationService.validarAvistamiento(any(Avistamiento.class)))
                .thenReturn("Error de validación");

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Error de validación"));

        verify(avistamientoService, never()).crearAvistamiento(any());
    }

    @Test
    void crearAvistamiento_ServiceException() throws Exception {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);
        when(avistamientoValidationService.validarAvistamiento(any(Avistamiento.class))).thenReturn(null);
        when(avistamientoService.crearAvistamiento(any(Avistamiento.class)))
                .thenThrow(new RuntimeException("Error de servicio"));

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Error interno del servidor al crear el avistamiento."));
    }

    @Test
    void crearAvistamiento_AutoSetFecha() throws Exception {
        Avistamiento avistamientoSinFecha = new Avistamiento();
        avistamientoSinFecha.setEmailUsuario("test@example.com");
        avistamientoSinFecha.setFecha(null);

        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);
        when(avistamientoValidationService.validarAvistamiento(any(Avistamiento.class))).thenReturn(null);
        when(avistamientoService.crearAvistamiento(any(Avistamiento.class))).thenReturn(avistamientoTest);

        mockMvc.perform(post("/avistamientos/crear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoSinFecha)))
                .andExpect(status().isOk());

        verify(avistamientoService).crearAvistamiento(argThat(avistamiento ->
                avistamiento.getFecha() != null));
    }

    // ============ PRUEBAS PARA OBTENER POR ID ============

    @Test
    void obtenerAvistamientoPorId_Found() throws Exception {
        when(avistamientoService.obtenerAvistamientoPorId(1L)).thenReturn(Optional.of(avistamientoTest));

        mockMvc.perform(get("/avistamientos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idAvistamiento").value(1L))
                .andExpect(jsonPath("$.emailUsuario").value("test@example.com"));
    }

    @Test
    void obtenerAvistamientoPorId_NotFound() throws Exception {
        when(avistamientoService.obtenerAvistamientoPorId(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/avistamientos/1"))
                .andExpect(status().isNotFound());
    }

    // ============ PRUEBAS PARA OBTENER POR USUARIO ============

    @Test
    void obtenerAvistamientosPorUsuario_Success() throws Exception {
        List<Avistamiento> avistamientos = Arrays.asList(avistamientoTest);
        when(avistamientoService.obtenerAvistamientosPorUsuario("test@example.com"))
                .thenReturn(avistamientos);

        mockMvc.perform(get("/avistamientos/usuario/test@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idAvistamiento").value(1L))
                .andExpect(jsonPath("$[0].emailUsuario").value("test@example.com"));
    }

    // ============ PRUEBAS PARA OBTENER TODOS ============

    @Test
    void obtenerTodosLosAvistamientos_Success() throws Exception {
        List<Avistamiento> avistamientos = Arrays.asList(avistamientoTest);
        when(avistamientoService.obtenerTodosLosAvistamientos()).thenReturn(avistamientos);

        mockMvc.perform(get("/avistamientos/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idAvistamiento").value(1L));
    }

    // ============ PRUEBAS PARA ÚLTIMO AVISTAMIENTO ============

    @Test
    void obtenerUltimoAvistamiento_Found() throws Exception {
        when(avistamientoService.obtenerUltimoAvistamiento(1L)).thenReturn(Optional.of(avistamientoTest));

        // Act & Assert
        mockMvc.perform(get("/avistamientos/ultimo/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idAvistamiento").value(1L));
    }

    @Test
    void obtenerUltimoAvistamiento_NotFound() throws Exception {
        when(avistamientoService.obtenerUltimoAvistamiento(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/avistamientos/ultimo/1"))
                .andExpect(status().isNotFound());
    }

    // ============ PRUEBAS PARA FILTRAR ============

    @Test
    void obtenerAvistamientosFiltrados_AllParams() throws Exception {
        List<Avistamiento> avistamientos = Arrays.asList(avistamientoTest);
        when(avistamientoService.obtenerAvistamientosFiltrados(eq("Juan"), eq("Madrid"), any(LocalDate.class)))
                .thenReturn(avistamientos);

        mockMvc.perform(get("/avistamientos/filtrar")
                        .param("nombre", "Juan")
                        .param("lugar", "Madrid")
                        .param("fecha", "2024-01-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idAvistamiento").value(1L));
    }

    @Test
    void obtenerAvistamientosFiltrados_NoParams() throws Exception {
        // Arrange
        List<Avistamiento> avistamientos = Arrays.asList(avistamientoTest);
        when(avistamientoService.obtenerAvistamientosFiltrados(null, null, null))
                .thenReturn(avistamientos);

        // Act & Assert
        mockMvc.perform(get("/avistamientos/filtrar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idAvistamiento").value(1L));
    }

    // ============ PRUEBAS PARA ACTUALIZAR ============

    @Test
    void actualizarAvistamiento_Success() throws Exception {
        Avistamiento avistamientoActualizado = new Avistamiento();
        avistamientoActualizado.setIdAvistamiento(1L);
        avistamientoActualizado.setEmailUsuario("updated@example.com");

        when(avistamientoService.actualizarAvistamiento(eq(1L), any(Avistamiento.class)))
                .thenReturn(avistamientoActualizado);

        mockMvc.perform(put("/avistamientos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoActualizado)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailUsuario").value("updated@example.com"));
    }

    @Test
    void actualizarAvistamiento_IdMismatch() throws Exception {
        Avistamiento avistamientoConIdDiferente = new Avistamiento();
        avistamientoConIdDiferente.setIdAvistamiento(2L);
        avistamientoConIdDiferente.setEmailUsuario("test@example.com");

        when(avistamientoService.actualizarAvistamiento(eq(1L), any(Avistamiento.class)))
                .thenReturn(avistamientoTest);

        mockMvc.perform(put("/avistamientos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoConIdDiferente)))
                .andExpect(status().isOk());

        verify(avistamientoService).actualizarAvistamiento(eq(1L), argThat(avistamiento ->
                avistamiento.getIdAvistamiento().equals(1L)));
    }

    @Test
    void actualizarAvistamiento_NotFound() throws Exception {
        when(avistamientoService.actualizarAvistamiento(eq(1L), any(Avistamiento.class)))
                .thenThrow(new RuntimeException("Avistamiento no encontrado"));

        mockMvc.perform(put("/avistamientos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Avistamiento no encontrado"));
    }

    @Test
    void actualizarAvistamiento_RuntimeException() throws Exception {
        when(avistamientoService.actualizarAvistamiento(eq(1L), any(Avistamiento.class)))
                .thenThrow(new RuntimeException("Error de validación"));

        mockMvc.perform(put("/avistamientos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avistamientoTest)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(containsString("Error del servidor al actualizar el avistamiento")));
    }
}