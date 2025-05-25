package com.trackme.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class GeoLocationService {
    private static final double EARTH_RADIUS = 6371000; // Radio en metros
    private static final Logger logger = LoggerFactory.getLogger(GeoLocationService.class);

    public double calculateDistance(String coord1, String coord2) {
        try {
            // Limpieza de coordenadas
            coord1 = coord1.replaceAll("\\s+", ""); // Elimina espacios
            coord2 = coord2.replaceAll("\\s+", "");

            // Validación básica de formato
            if (!coord1.matches("-?\\d{1,3}\\.\\d+,-?\\d{1,3}\\.\\d+") ||
                    !coord2.matches("-?\\d{1,3}\\.\\d+,-?\\d{1,3}\\.\\d+")) {
                throw new IllegalArgumentException("Formato de coordenadas inválido");
            }

            String[] parts1 = coord1.split(",");
            String[] parts2 = coord2.split(",");

            double lat1 = Double.parseDouble(parts1[0]);
            double lon1 = Double.parseDouble(parts1[1]);
            double lat2 = Double.parseDouble(parts2[0]);
            double lon2 = Double.parseDouble(parts2[1]);

            // Validar rangos geográficos
            if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 ||
                    Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
                throw new IllegalArgumentException("Coordenadas fuera de rango válido");
            }

            // Conversión a radianes
            double lat1Rad = Math.toRadians(lat1);
            double lon1Rad = Math.toRadians(lon1);
            double lat2Rad = Math.toRadians(lat2);
            double lon2Rad = Math.toRadians(lon2);

            // Diferencia entre coordenadas
            double dLat = lat2Rad - lat1Rad;
            double dLon = lon2Rad - lon1Rad;

            // Fórmula de Haversine
            double a = Math.pow(Math.sin(dLat / 2), 2) +
                    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                            Math.pow(Math.sin(dLon / 2), 2);

            double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return EARTH_RADIUS * c;
        } catch (Exception e) {
            logger.error("Error calculando distancia entre {} y {}: {}", coord1, coord2, e.getMessage());
            throw new RuntimeException("Error en cálculo de distancia: " + e.getMessage(), e);
        }
    }
}