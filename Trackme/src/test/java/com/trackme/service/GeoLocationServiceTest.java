package com.trackme.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GeoLocationServiceTest {

    @InjectMocks
    private GeoLocationService geoLocationService;

    @BeforeEach
    void setUp() {
        geoLocationService = new GeoLocationService();
    }

    @Test
    void testCalculateDistance_ValidCoordinates() {
        String laPaz = "-16.5000,-68.1500";
        String santaCruz = "-17.7833,-63.1821";

        double distance = geoLocationService.calculateDistance(laPaz, santaCruz);

        assertTrue(distance > 400000 && distance < 600000,
                "La distancia debería estar entre 400-600 km, pero fue: " + distance);
    }

    @Test
    void testCalculateDistance_SameCoordinates() {
        String coord = "-16.5000,-68.1500";

        double distance = geoLocationService.calculateDistance(coord, coord);

        assertEquals(0.0, distance, 0.1, "La distancia entre las mismas coordenadas debe ser 0");
    }

    @Test
    void testCalculateDistance_WithSpaces() {
        String coord1 = " -16.5000 , -68.1500 ";
        String coord2 = "-17.7833,-63.1821";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 0, "Debe calcular distancia correctamente eliminando espacios");
    }

    @Test
    void testCalculateDistance_InvalidFormat_MissingComma() {
        String coord1 = "-16.5000-68.1500";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getMessage().contains("Error en cálculo de distancia"));
        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertEquals("Formato de coordenadas inválido", exception.getCause().getMessage());
    }

    @Test
    void testCalculateDistance_InvalidFormat_Letters() {
        String coord1 = "abc,def";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getMessage().contains("Error en cálculo de distancia"));
    }

    @Test
    void testCalculateDistance_InvalidFormat_EmptyString() {
        String coord1 = "";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getMessage().contains("Error en cálculo de distancia"));
    }

    @Test
    void testCalculateDistance_InvalidLatitude_OutOfRange() {
        String coord1 = "91.0000,-68.1500";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertEquals("Coordenadas fuera de rango válido", exception.getCause().getMessage());
    }

    @Test
    void testCalculateDistance_InvalidLatitude_NegativeOutOfRange() {
        String coord1 = "-91.0000,-68.1500";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertEquals("Coordenadas fuera de rango válido", exception.getCause().getMessage());
    }

    @Test
    void testCalculateDistance_InvalidLongitude_OutOfRange() {
        String coord1 = "-16.5000,181.0000";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertEquals("Coordenadas fuera de rango válido", exception.getCause().getMessage());
    }

    @Test
    void testCalculateDistance_InvalidLongitude_NegativeOutOfRange() {
        String coord1 = "-16.5000,-181.0000";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertEquals("Coordenadas fuera de rango válido", exception.getCause().getMessage());
    }

    @Test
    void testCalculateDistance_BoundaryValues() {
        String coord1 = "90.0000,180.0000";
        String coord2 = "-90.0000,-180.0000";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 0, "Debe calcular distancia para coordenadas en los límites");
        assertTrue(distance <= 20037000, "No debe exceder la distancia máxima posible");
    }

    @Test
    void testCalculateDistance_CoordinatesWithManyDecimals() {
        String coord1 = "-16.5000123,-68.1500456";
        String coord2 = "-17.7833789,-63.1821012";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 0, "Debe manejar coordenadas con muchos decimales");
    }

    @Test
    void testCalculateDistance_ZeroCoordinates() {
        String coord1 = "0.0000,0.0000";
        String coord2 = "1.0000,1.0000";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 0, "Debe calcular distancia desde coordenadas (0,0)");
        assertTrue(distance < 200000, "La distancia debe ser razonable para 1 grado de diferencia");
    }

    @Test
    void testCalculateDistance_NorthSouthDistance() {
        String coord1 = "0.0000,0.0000";
        String coord2 = "1.0000,0.0000";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 110000 && distance < 112000,
                "1 grado de latitud debe ser ~111km, pero fue: " + distance);
    }

    @Test
    void testCalculateDistance_EastWestDistance() {
        String coord1 = "0.0000,0.0000";
        String coord2 = "0.0000,1.0000";

        double distance = geoLocationService.calculateDistance(coord1, coord2);

        assertTrue(distance > 110000 && distance < 112000,
                "1 grado de longitud en el ecuador debe ser ~111km, pero fue: " + distance);
    }

    @Test
    void testCalculateDistance_NullCoordinate() {
        String coord1 = null;
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getMessage().contains("Error en cálculo de distancia"));
    }

    @Test
    void testCalculateDistance_InvalidFormat_TooManyParts() {
        String coord1 = "-16.5000,-68.1500,100";
        String coord2 = "-17.7833,-63.1821";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geoLocationService.calculateDistance(coord1, coord2);
        });

        assertTrue(exception.getMessage().contains("Error en cálculo de distancia"));
    }
}