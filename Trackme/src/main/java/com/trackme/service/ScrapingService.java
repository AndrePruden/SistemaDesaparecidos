package com.trackme.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;

@Service
public class ScrapingService {

    private static final Logger logger = LoggerFactory.getLogger(ScrapingService.class);

    private static final String URL_POLICIA = "https://www.policia.bo/desaparecidos";

    public boolean verificarPersonaDesaparecida(String nombre) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String htmlContent = restTemplate.getForObject(URL_POLICIA, String.class);
            Document document = Jsoup.parse(htmlContent);
            for (Element postListItem : document.select("div.blfe-post-list-item")) {
                String nombreEncontrado = postListItem.select("h3.blfe-post-list-title a").text();
                String nombreLimpio = limpiarNombre(nombreEncontrado);
                logger.info("Comparando: '{}' con '{}'", nombreLimpio, nombre);
                if (nombreLimpio.toLowerCase().contains(nombre.toLowerCase())) {
                    logger.info("Persona encontrada: {}", nombreLimpio);
                    return true;
                }
            }
            logger.warn("No se encontró la persona con el nombre: {}", nombre);
            return false;
        } catch (Exception e) {
            logger.error("Error al realizar el scraping de la página de la Policía Boliviana: {}", e.getMessage(), e);
            return false;
        }
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
}