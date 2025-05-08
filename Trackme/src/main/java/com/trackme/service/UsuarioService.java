package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    private static final Logger logger = LoggerFactory.getLogger(UsuarioService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UsuarioService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Optional<Usuario> obtenerUsuarioPorEmail(String email) {
        logger.debug("Consultando usuario por email: {}", email);
        return userRepository.findByEmail(email);
    }

    public Optional<Usuario> obtenerUsuarioPorId(Long id) {
        logger.debug("Consultando usuario por ID: {}", id);
        return userRepository.findById(id);
    }

    public Usuario crearUsuario(Usuario usuario) {
        logger.info("Creando nuevo usuario con email: {}", usuario.getEmail());
        if (userRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con este email.");
        }
        if (userRepository.findByCi(usuario.getCi()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con este CI.");
        }
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return userRepository.save(usuario);
    }

    public Usuario actualizarUsuario(Usuario usuario) {
        logger.info("Actualizando usuario con ID: {}", usuario.getId());

        Usuario existente = userRepository.findById(usuario.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + usuario.getId()));

        if (usuario.getPassword() != null && !usuario.getPassword().isBlank()) {
            existente.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }

        existente.setNombre(usuario.getNombre());
        existente.setFechaNacimiento(usuario.getFechaNacimiento());
        existente.setCelular(usuario.getCelular());
        existente.setDireccion(usuario.getDireccion());
        existente.setNotificaciones(usuario.getNotificaciones());

        return userRepository.save(existente);
    }

    public boolean verificarContraseña(String contraseñaIngresada, String contraseñaEncriptada) {
        logger.debug("Verificando contraseña para el usuario.");
        return passwordEncoder.matches(contraseñaIngresada, contraseñaEncriptada);
    }

    public void eliminarUsuario(Long id) {
        logger.info("Eliminando usuario con ID: {}", id);
        userRepository.findById(id).ifPresent(userRepository::delete);
    }
}