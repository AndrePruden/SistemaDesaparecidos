package com.trackme.service;

import com.trackme.model.DesaparecidoOficial;
import com.trackme.repository.DesaparecidoOficialRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ScrapingService {

    private static final Logger logger = LoggerFactory.getLogger(ScrapingService.class);

    private static final String URL_POLICIA = "https://www.policia.bo/desaparecidos";

    @Autowired
    private DesaparecidoOficialRepository desaparecidoRepo;

    public boolean verificarPersonaDesaparecida(String nombre) {
        List<DesaparecidoOficial> coincidencias = desaparecidoRepo.findByNombreContainingIgnoreCase(nombre);
        if (!coincidencias.isEmpty()) {
            logger.info("Persona '{}' encontrada en la base de datos local.", nombre);
            return true;
        }
        logger.warn("Persona '{}' no encontrada en la base local.", nombre);
        return false;
    }


    private String limpiarNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        String nombreLimpio = decodeUnicode(nombre);
        nombreLimpio = nombreLimpio.replaceAll("(?i)BUSCAMOS A", "").trim();
        nombreLimpio = nombreLimpio.replaceAll("DE \\d+ AÑOS DE EDAD", "").trim();
        nombreLimpio = normalizarTexto(nombreLimpio);
        nombreLimpio = nombreLimpio.replaceAll("\\s+", " ").trim();
        return nombreLimpio;
    }

    private String decodeUnicode(String unicodeStr) {
        if (unicodeStr == null) return "";
        StringBuilder sb = new StringBuilder();
        String[] parts = unicodeStr.split("\\\\u");
        sb.append(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            String part = parts[i];
            if (part.length() >= 4) {
                try {
                    int codePoint = Integer.parseInt(part.substring(0, 4), 16);
                    sb.append((char) codePoint);
                    sb.append(part.substring(4));
                } catch (NumberFormatException e) {
                    sb.append("\\u").append(part);
                }
            } else {
                sb.append("\\u").append(part);
            }
        }
        return sb.toString();
    }

    private String normalizarTexto(String texto) {
        if (texto == null) return "";
        String normalized = Normalizer.normalize(texto, Normalizer.Form.NFKD);
        return normalized.replaceAll("[^\\p{ASCII}]", "");
    }

    public void verTodosLosNombresDesaparecidos() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String htmlContent = restTemplate.getForObject(URL_POLICIA, String.class);
            Document document = Jsoup.parse(htmlContent);

            for (Element postListItem : document.select("div.blfe-post-list-details")) {
                String nombreEncontrado = postListItem.select("h3.blfe-post-list-title a").text();
                String nombreLimpio = limpiarNombre(nombreEncontrado);

                logger.info("Nombre encontrado: {}", nombreLimpio);
            }
        } catch (Exception e) {
            logger.error("Error al realizar el scraping de la página de la Policía Boliviana: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 29 14 * * WED") // Ejecutar cada lunes a las 8 AM
    public void actualizarDesaparecidos() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String htmlContent = restTemplate.getForObject(URL_POLICIA, String.class);
            Document document = Jsoup.parse(htmlContent);

            desaparecidoRepo.deleteAll(); // Limpiar tabla antes de insertar nuevos

            for (Element postListItem : document.select("div.blfe-post-list-item")) {
                String nombreBruto = postListItem.select("h3.blfe-post-list-title a").text();
                String nombreLimpio = limpiarNombre(nombreBruto);

                if (nombreLimpio != null && nombreLimpio.length() < 100) {
                    DesaparecidoOficial desaparecido = new DesaparecidoOficial();
                    desaparecido.setNombre(nombreLimpio);

                    desaparecidoRepo.save(desaparecido);
                } else {
                    logger.warn("Nombre vacío o inválido detectado, se omite el registro: {}", nombreBruto);
                }

            }
            logger.info("Actualización de desaparecidos completa.");
        } catch (Exception e) {
            logger.error("Error al actualizar la lista de desaparecidos oficiales: {}", e.getMessage(), e);
        }
    }
}