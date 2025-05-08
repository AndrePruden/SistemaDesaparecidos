package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UsuarioService usuarioService;

    public UserController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody Usuario usuario) {
        logger.info("Intento de registro: {}", usuario.getEmail());

        try {
            if (usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()).isPresent()) {
                logger.warn("Registro fallido: email ya registrado");
                return ResponseEntity.badRequest().body(new ResponseMessage("El correo ya está registrado."));
            }

            Usuario nuevoUsuario = usuarioService.crearUsuario(usuario);
            logger.info("Registro exitoso para: {}", nuevoUsuario.getEmail());

            return ResponseEntity.status(201).body(nuevoUsuario);

        } catch (IllegalArgumentException e) {
            logger.warn("Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ResponseMessage(e.getMessage()));

        } catch (Exception e) {
            logger.error("Error interno al registrar usuario", e);
            return ResponseEntity.internalServerError().body(new ResponseMessage("Error interno al registrar usuario."));
        }
    }

    @PostMapping("/iniciar-sesion")
    public ResponseEntity<?> iniciarSesion(@RequestBody Usuario usuario) {
        logger.info("Inicio de sesión para: {}", usuario.getEmail());
        Optional<Usuario> existingUser = usuarioService.obtenerUsuarioPorEmail(usuario.getEmail());
        if (!existingUser.isPresent()) {
            logger.warn("Inicio de sesión fallido: el correo {} no está registrado", usuario.getEmail());
            return ResponseEntity.status(404).body(new ResponseMessage("El correo electrónico no está registrado."));
        }
        if (usuarioService.verificarContraseña(usuario.getPassword(), existingUser.get().getPassword())) {
            logger.info("Inicio de sesión exitoso para: {}", usuario.getEmail());
            return ResponseEntity.ok(new ResponseMessage("Inicio de sesión exitoso."));
        }
        logger.warn("Contraseña incorrecta para el correo: {}", usuario.getEmail());
        return ResponseEntity.status(401).body(new ResponseMessage("Contraseña incorrecta."));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> obtenerUsuarioPorEmail(@PathVariable String email) {
        logger.info("Consulta de usuario por email: {}", email);

        Optional<Usuario> usuarioOpt = usuarioService.obtenerUsuarioPorEmail(email);
        if (usuarioOpt.isPresent()) {
            return ResponseEntity.ok(usuarioOpt.get());
        } else {
            logger.warn("Usuario no encontrado para el email: {}", email);
            return ResponseEntity.status(404).body(new ResponseMessage("Usuario no encontrado."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        logger.info("Actualización de usuario con ID: {}", id);

        if (usuarioService.obtenerUsuarioPorId(id).isEmpty()) {
            logger.warn("Usuario no encontrado para actualizar: {}", id);
            return ResponseEntity.status(404).body(new ResponseMessage("Usuario no encontrado."));
        }

        usuario.setId(id);
        Usuario actualizado = usuarioService.actualizarUsuario(usuario);
        logger.info("Usuario actualizado: {}", actualizado.getEmail());

        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        logger.info("Eliminación de usuario con ID: {}", id);

        if (usuarioService.obtenerUsuarioPorId(id).isEmpty()) {
            logger.warn("Usuario no encontrado para eliminar: {}", id);
            return ResponseEntity.status(404).body(new ResponseMessage("Usuario no encontrado."));
        }

        usuarioService.eliminarUsuario(id);
        logger.info("Usuario eliminado: ID {}", id);
        return ResponseEntity.noContent().build();
    }
}
