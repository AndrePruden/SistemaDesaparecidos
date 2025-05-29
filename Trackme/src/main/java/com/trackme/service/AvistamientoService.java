package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import com.trackme.repository.ReporteRepository; // Asegúrate de que ReporteRepository esté inyectado si lo usas
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Importar Transactional

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Date;

@Service
public class AvistamientoService {

    private static final Logger logger = LoggerFactory.getLogger(AvistamientoService.class);

    @Autowired
    private AvistamientoRepository avistamientoRepository;

    @Autowired
    private EmailService emailService; // Asumo que usas este servicio

    @Autowired
    private ReporteRepository reporteRepository; // Asumo que usas este repositorio

    @Autowired
    private GeoLocationService geoLocationService; // Asumo que usas este servicio


    @Transactional // Buena práctica para operaciones de escritura
    public Avistamiento crearAvistamiento(Avistamiento avistamiento) {
        logger.info("Service: Creando nuevo avistamiento para el usuario: {}", avistamiento.getEmailUsuario());

        Avistamiento creado = avistamientoRepository.save(avistamiento);

        if (creado.getDescripcion() != null && !creado.getDescripcion().startsWith("Reporte inicial")) { // Verificar que getDescripcion() no es null
            enviarNotificacionAvistamiento(creado);
        } else if (creado.getDescripcion() == null) {
             logger.debug("Service: Descripción del avistamiento es null, no se envía notificación.");
        } else {
             logger.debug("Service: Descripción del avistamiento comienza con 'Reporte inicial', no se envía notificación.");
        }


        logger.info("Service: Avistamiento creado con ID: {}", creado.getIdAvistamiento());
        return creado;
    }

    private void enviarNotificacionAvistamiento(Avistamiento avistamiento) {
        try {
            if (avistamiento.getPersonaDesaparecida() == null ||
                    avistamiento.getPersonaDesaparecida().getIdDesaparecido() == null) {
                logger.warn("Service: Avistamiento {} no tiene persona desaparecida asociada",
                        avistamiento.getIdAvistamiento());
                return;
            }

            Long idReporte = avistamiento.getPersonaDesaparecida().getIdDesaparecido();

            Optional<PersonaDesaparecida> reporteOpt = reporteRepository.findById(idReporte); // Usar findById

            if (!reporteOpt.isPresent()) {
                logger.error("Service: No se encontró el reporte con ID: {}", idReporte);
                return;
            }

            PersonaDesaparecida reporte = reporteOpt.get();

            logger.info("Service: Enviando notificación a {} sobre nuevo avistamiento",
                    reporte.getEmailReportaje());
            emailService.sendSightingNotification(reporte, avistamiento);

        } catch (Exception e) {
            logger.error("Service: Error al enviar notificación para avistamiento {}: {}",
                    avistamiento.getIdAvistamiento(), e.getMessage());
        }
    }

    // --- AÑADIR ESTE MÉTODO: Obtener avistamiento por su ID (para carga en edición) ---
    @Transactional(readOnly = true) // Operación de lectura
    public Optional<Avistamiento> obtenerAvistamientoPorId(Long id) {
        logger.info("Service: Buscando avistamiento por ID: {}", id);
        Optional<Avistamiento> avistamiento = avistamientoRepository.findById(id); // Usa findById de JpaRepository
        if (avistamiento.isPresent()) {
            logger.info("Service: Avistamiento con ID {} encontrado.", id);
        } else {
            logger.warn("Service: Avistamiento con ID {} no encontrado en el repositorio.", id);
        }
        return avistamiento;
    }
    // ---------------------------------------------------------------------------------


    public List<Avistamiento> obtenerAvistamientosPorUsuario(String emailUsuario) {
        logger.info("Service: Obteniendo avistamientos para el usuario: {}", emailUsuario);
        List<Avistamiento> avistamientos = avistamientoRepository.findByEmailUsuario(emailUsuario);
        logger.info("Service: Cantidad de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;
    }

    public List<Avistamiento> obtenerAvistamientosPorReporte(Long idPersonaDesaparecida) {
        logger.info("Service: Obteniendo avistamientos para la persona desaparecida con ID: {}", idPersonaDesaparecida);
        List<Avistamiento> avistamientos = avistamientoRepository.findByPersonaDesaparecida_IdDesaparecido(idPersonaDesaparecida);
        logger.info("Service: Cantidad de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;

    }

    public List<Avistamiento> obtenerTodosLosAvistamientos() {
        logger.info("Service: Obteniendo todos los avistamientos del sistema");
        List<Avistamiento> avistamientos = avistamientoRepository.findAll();
        logger.info("Service: Total de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;
    }

    @Transactional(readOnly = true) // Operación de lectura
    public Optional<Avistamiento> obtenerUltimoAvistamiento(Long idReporte) {
        logger.info("Service: Buscando el último avistamiento para la persona desaparecida con ID: {}", idReporte);
        // La query en el repositorio ya ordena por fecha DESC, ID DESC
         List<Avistamiento> lista = avistamientoRepository.findUltimoAvistamientoPorReporte(idReporte);
        if (lista.isEmpty()) {
            logger.warn("Service: No se encontraron avistamientos para el ID_PersonaDesaparecida: {}", idReporte);
            return Optional.empty();
        } else {
            // --- CORRECCIÓN AQUÍ: Tomar el primer elemento (índice 0) de la lista ordenada DESC ---
            Avistamiento ultimoAvistamiento = lista.get(0);
            // --- NO usar lista.get(lista.size() - 1) que daría el MÁS ANTIGUO ---
            logger.info("Service: Último avistamiento encontrado con ID: {} para Reporte ID {}.", ultimoAvistamiento.getIdAvistamiento(), idReporte);
            return Optional.of(ultimoAvistamiento);
        }
    }

    public List<Avistamiento> obtenerAvistamientosFiltrados(String nombre, String lugar, LocalDate fecha) {
        logger.info("Service: Aplicando filtros: nombre={}, lugar={}, fecha={}", nombre, lugar, fecha);
        List<Avistamiento> avistamientos = obtenerTodosLosAvistamientos();

        // Asegurarse de que PersonaDesaparecida no sea nula antes de acceder a getNombre()
        if (nombre != null && !nombre.isEmpty()) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getPersonaDesaparecida() != null && r.getPersonaDesaparecida().getNombre() != null && r.getPersonaDesaparecida().getNombre().toLowerCase().contains(nombre.toLowerCase()))
                    .collect(Collectors.toList());
        }
         // Asegurarse de que getUbicacion() no sea nulo antes de llamar a toLowerCase()
        if (lugar != null && !lugar.isEmpty()) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getUbicacion() != null && r.getUbicacion().toLowerCase().contains(lugar.toLowerCase()))
                    .collect(Collectors.toList());
        }
        // Asegurarse de que getFecha() no sea nulo antes de procesar
        if (fecha != null) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getFecha() != null && r.getFecha().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().equals(fecha))
                    .collect(Collectors.toList());
        }

        logger.info("Service: Resultados filtrados: {} avistamientos.", avistamientos.size());
        return avistamientos;
    }

    // --- AÑADIR ESTE MÉTODO: Lógica para actualizar un avistamiento ---
    @Transactional // Operación de escritura
    public Avistamiento actualizarAvistamiento(Long id, Avistamiento avistamientoActualizado) {
        logger.info("Service: Intentando actualizar avistamiento con ID: {}", id);

        Optional<Avistamiento> existingAvistamientoOpt = avistamientoRepository.findById(id);

        if (!existingAvistamientoOpt.isPresent()) {
            logger.warn("Service: Avistamiento con ID {} no encontrado para actualizar.", id);
            // Lanzar una excepción que el controlador pueda manejar para retornar 404
            throw new RuntimeException("Avistamiento no encontrado con ID: " + id);
        }

        Avistamiento existingAvistamiento = existingAvistamientoOpt.get();
        logger.info("Service: Avistamiento existente con ID {} encontrado. Actualizando campos.", id);

        // Actualizar solo los campos que pueden venir en el payload de actualización
        // No actualizar emailUsuario ni idAvistamiento desde aquí
        if (avistamientoActualizado.getFecha() != null) {
             existingAvistamiento.setFecha(avistamientoActualizado.getFecha());
        }
        if (avistamientoActualizado.getUbicacion() != null && !avistamientoActualizado.getUbicacion().isEmpty()) {
             existingAvistamiento.setUbicacion(avistamientoActualizado.getUbicacion());
        }
        // La descripción puede ser nula o vacía, asignar directamente si viene
        existingAvistamiento.setDescripcion(avistamientoActualizado.getDescripcion());


        // Si el payload incluye un ID de PersonaDesaparecida, actualizar la referencia
        // Esto permite cambiar el reporte asociado a un avistamiento si fuera necesario (aunque no es común)
        // O simplemente re-asignar la referencia si ya venía para asegurar que está enganchado
        if (avistamientoActualizado.getPersonaDesaparecida() != null && avistamientoActualizado.getPersonaDesaparecida().getIdDesaparecido() != null) {
             Long newPersonaId = avistamientoActualizado.getPersonaDesaparecida().getIdDesaparecido();
             logger.debug("Service: Actualizando PersonaDesaparecida asociada a ID: {}", newPersonaId);

              // Crea una referencia (proxy) a la PersonaDesaparecida sin cargarla completamente
              PersonaDesaparecida referencedPersona = new PersonaDesaparecida();
              referencedPersona.setIdDesaparecido(newPersonaId); // Asegúrate de usar el método setter correcto (setId o setIdDesaparecido)
              existingAvistamiento.setPersonaDesaparecida(referencedPersona); // Asigna la referencia
              logger.debug("Service: Asignada referencia de PersonaDesaparecida con ID {} al avistamiento.", newPersonaId);

        }
        // Si el payload indica que no debe haber persona asociada o el ID es nulo, puedes decidir desvincular
        // else if (avistamientoActualizado.getPersonaDesaparecida() == null || avistamientoActualizado.getPersonaDesaparecida().getIdDesaparecido() == null) {
        //     existingAvistamiento.setPersonaDesaparecida(null);
        //     logger.warn("Service: Payload de actualización indica PersonaDesaparecida nula o sin ID. Desvinculando Persona.");
        // }
       // Nota: Normalmente la personaDesaparecida NO cambia en una actualización de avistamiento. Si este campo SIEMPRE viene
       // del frontend con el ID original, no necesitas este bloque if/else. Si el frontend permite cambiarlo, esta lógica es necesaria.
       // O si el frontend solo envía el ID original para asegurar que no se pierde la asociación.

        Avistamiento updatedAvistamiento = avistamientoRepository.save(existingAvistamiento); // Guarda los cambios
        logger.info("Service: Avistamiento con ID {} guardado/actualizado exitosamente.", updatedAvistamiento.getIdAvistamiento());
        logger.debug("Service: Avistamiento actualizado después de guardar: {}", updatedAvistamiento);

        // Opcional: Si actualizar un avistamiento debe generar una nueva notificación, llamarla aquí
        // enviarNotificacionAvistamiento(updatedAvistamiento); // Considerar si es apropiado al actualizar

        return updatedAvistamiento; // Devuelve el avistamiento actualizado
    }
    // ------------------------------------------------------------------------------
}