package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.PersonaDesaparecidaService;
import com.trackme.service.ReporteValidationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "feature.create-reports.enabled=true")
class ReporteControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @TestConfiguration
    static class TestConfig {

        @Bean
        public PersonaDesaparecidaService personaDesaparecidaService() {
            return new PersonaDesaparecidaService() {
                @Override
                public PersonaDesaparecida crearReporte(PersonaDesaparecida persona) {
                    return persona;
                }

                @Override
                public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
                    PersonaDesaparecida persona = new PersonaDesaparecida();
                    persona.setNombre("Maria");
                    persona.setEdad(25);
                    persona.setLugarDesaparicion("Cochabamba");
                    persona.setDescripcion("Desaparecida");
                    persona.setEmailReportaje(email);
                    persona.setFechaDesaparicion(Date.from(LocalDate.of(2025, 4, 10)
                            .atStartOfDay(ZoneId.systemDefault()).toInstant()));
                    return List.of(persona);
                }

                @Override
                public List<PersonaDesaparecida> obtenerTodosLosReportes() {
                    PersonaDesaparecida persona = new PersonaDesaparecida();
                    persona.setNombre("Carlos");
                    persona.setEdad(40);
                    persona.setLugarDesaparicion("La Paz");
                    persona.setDescripcion("Desaparecido");
                    persona.setEmailReportaje("carlos@email.com");
                    persona.setFechaDesaparicion(Date.from(LocalDate.of(2025, 3, 15)
                            .atStartOfDay(ZoneId.systemDefault()).toInstant()));
                    return List.of(persona);
                }
            };
        }

        @Bean
        public ReporteValidationService reporteValidationService() {
            return new ReporteValidationService() {
                @Override
                public String validarReporte(PersonaDesaparecida persona) {
                    return null; // Siempre válido
                }
            };
        }
    }

    @Test
    void testCrearReporteSinImagen() throws Exception {
        mockMvc.perform(multipart("/reportes/crear")
                        .param("nombre", "Juan")
                        .param("edad", "30")
                        .param("fechaDesaparicion", "2025-04-20")
                        .param("lugarDesaparicion", "Cochabamba")
                        .param("descripcion", "Persona desaparecida")
                        .param("emailReportaje", "juan@example.com")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Juan"))
                .andExpect(jsonPath("$.edad").value(30))
                .andExpect(jsonPath("$.emailReportaje").value("juan@example.com"));
    }

    @Test
    void testObtenerReportesPorUsuario() throws Exception {
        mockMvc.perform(get("/reportes/usuario/maria@email.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Maria"))
                .andExpect(jsonPath("$[0].edad").value(25))
                .andExpect(jsonPath("$[0].emailReportaje").value("maria@email.com"));
    }

    @Test
    void testObtenerTodosLosReportes() throws Exception {
        mockMvc.perform(get("/reportes/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Carlos"))
                .andExpect(jsonPath("$[0].edad").value(40))
                .andExpect(jsonPath("$[0].emailReportaje").value("carlos@email.com"));
    }

}