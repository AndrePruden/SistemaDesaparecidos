package com.trackme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.model.Usuario;
import com.trackme.repository.ReporteRepository;
import com.trackme.repository.UserRepository;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Date;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "feature.create-reports.enabled=true")
class ReporteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private UserRepository usuarioRepository;

    private final String testEmail = "test@example.com";

    @BeforeEach
    void setUp() {
        Usuario usuario = new Usuario();
        usuario.setEmail(testEmail);
        usuario.setUsername("Test User");
        usuario.setPassword("test123");
        usuarioRepository.save(usuario);
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public ReporteService personaDesaparecidaService() {
            return new ReporteService() {
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
                    return null;
                }
            };
        }
    }

//    @Test
//    public void testCrearReporteSinImagen() throws Exception {
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setNombre("Carlos");
//        reporte.setEdad(30);
//        reporte.setEmailReportaje(testEmail);
//        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2023, 1, 1)
//                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
//        reporte.setLugarDesaparicion("Ciudad");
//        reporte.setDescripcion("Desaparecido en zona urbana");
//
//        mockMvc.perform(post("/reportes")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(reporte)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.mensaje").value("Reporte creado correctamente"));
//    }

    @Test
    public void testObtenerReportesPorUsuario() throws Exception {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Carlos");
        reporte.setEdad(30);
        reporte.setEmailReportaje(testEmail);
        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2023, 1, 1)
                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Ciudad");
        reporte.setDescripcion("Desaparecido en zona urbana");
        reporteRepository.save(reporte);

        mockMvc.perform(get("/reportes/usuario/" + testEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Carlos"));
    }

//    @Test
//    public void testObtenerTodosLosReportes() throws Exception {
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setNombre("Carlos");
//        reporte.setEdad(30);
//        reporte.setEmailReportaje(testEmail);
//        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2025, 3, 15)
//                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
//        reporte.setLugarDesaparicion("Ciudad");
//        reporte.setDescripcion("Desaparecido en zona urbana");
//        reporteRepository.save(reporte);
//
//        mockMvc.perform(get("/reportes"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].nombre").value("Carlos"));
//    }
}