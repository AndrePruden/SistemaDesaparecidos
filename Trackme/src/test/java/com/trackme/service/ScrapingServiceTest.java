package com.trackme.service;

import com.trackme.model.DesaparecidoOficial;
import com.trackme.repository.DesaparecidoOficialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapingServiceTest {

    @Mock
    private DesaparecidoOficialRepository desaparecidoRepo;

    @InjectMocks
    private ScrapingService scrapingService;

    private DesaparecidoOficial desaparecido1;
    private DesaparecidoOficial desaparecido2;

    @BeforeEach
    void setUp() {
        desaparecido1 = new DesaparecidoOficial();
        desaparecido1.setNombre("Juan Perez");

        desaparecido2 = new DesaparecidoOficial();
        desaparecido2.setNombre("Maria Rodriguez");
    }

    @Test
    void testVerificarPersonaDesaparecida_PersonaEncontrada() {
        String nombreBusqueda = "Juan";
        List<DesaparecidoOficial> coincidencias = Arrays.asList(desaparecido1);
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(nombreBusqueda))
                .thenReturn(coincidencias);

        boolean resultado = scrapingService.verificarPersonaDesaparecida(nombreBusqueda);

        assertTrue(resultado);
        verify(desaparecidoRepo).findByNombreContainingIgnoreCase(nombreBusqueda);
    }

    @Test
    void testVerificarPersonaDesaparecida_PersonaNoEncontrada() {
        String nombreBusqueda = "Pedro";
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(nombreBusqueda))
                .thenReturn(Collections.emptyList());

        boolean resultado = scrapingService.verificarPersonaDesaparecida(nombreBusqueda);

        assertFalse(resultado);
        verify(desaparecidoRepo).findByNombreContainingIgnoreCase(nombreBusqueda);
    }

    @Test
    void testVerificarPersonaDesaparecida_VariasCoincidencias() {
        String nombreBusqueda = "Rodriguez";
        List<DesaparecidoOficial> coincidencias = Arrays.asList(desaparecido1, desaparecido2);
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(nombreBusqueda))
                .thenReturn(coincidencias);

        // When
        boolean resultado = scrapingService.verificarPersonaDesaparecida(nombreBusqueda);

        // Then
        assertTrue(resultado);
        verify(desaparecidoRepo).findByNombreContainingIgnoreCase(nombreBusqueda);
    }

    @Test
    void testVerificarPersonaDesaparecida_NombreNull() {
        // Given
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(null))
                .thenReturn(Collections.emptyList());

        // When
        boolean resultado = scrapingService.verificarPersonaDesaparecida(null);

        // Then
        assertFalse(resultado);
        verify(desaparecidoRepo).findByNombreContainingIgnoreCase(null);
    }

    @Test
    void testVerificarPersonaDesaparecida_NombreVacio() {
        // Given
        String nombreVacio = "";
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(nombreVacio))
                .thenReturn(Collections.emptyList());

        // When
        boolean resultado = scrapingService.verificarPersonaDesaparecida(nombreVacio);

        // Then
        assertFalse(resultado);
        verify(desaparecidoRepo).findByNombreContainingIgnoreCase(nombreVacio);
    }

    @Test
    void testVerificarPersonaDesaparecida_ExcepcionRepositorio() {
        // Given
        String nombreBusqueda = "Test";
        when(desaparecidoRepo.findByNombreContainingIgnoreCase(nombreBusqueda))
                .thenThrow(new RuntimeException("Error de base de datos"));

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            scrapingService.verificarPersonaDesaparecida(nombreBusqueda);
        });
    }

    // Nota: Los métodos que usan RestTemplate requieren mocks estáticos o pruebas de integración
    // Para estos casos, recomiendo usar @SpringBootTest con @MockBean
}