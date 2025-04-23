package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/registro")
    public ResponseEntity<ResponseMessage> registrarUsuario(@RequestBody Usuario usuario) {
        logger.info("Intento de registro para el correo: {}", usuario.getEmail());
        try {
            if (usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()).isPresent()) {
                logger.warn("Registro fallido: el correo {} ya está registrado", usuario.getEmail());
                return ResponseEntity.badRequest().body(new ResponseMessage("El correo ya está registrado."));
            }
            usuarioService.crearUsuario(usuario);
            logger.info("Usuario registrado exitosamente: {}", usuario.getEmail());
            return ResponseEntity.ok(new ResponseMessage("Usuario registrado con éxito."));
        } catch (Exception e) {
            logger.error("Error al registrar usuario: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ResponseMessage("Hubo un error al registrar el usuario: " + e.getMessage()));
        }
    }

    @PostMapping("/iniciar-sesion")
    public ResponseEntity<ResponseMessage> iniciarSesion(@RequestBody Usuario usuario) {
        logger.info("Intento de inicio de sesión para: {}", usuario.getEmail());
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        logger.info("Solicitud para eliminar usuario con ID: {}", id);
        if (usuarioService.obtenerUsuarioPorId(id).isPresent()) {
            usuarioService.eliminarUsuario(id);
            logger.info("Usuario eliminado con éxito: ID {}", id);
            return ResponseEntity.noContent().build();
        }
        logger.warn("Intento de eliminar usuario no existente: ID {}", id);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        logger.info("Solicitud para actualizar usuario con ID: {}", id);
        Optional<Usuario> existingUser = usuarioService.obtenerUsuarioPorId(id);
        if (existingUser.isPresent()) {
            usuario.setId(id);
            Usuario usuarioActualizado = usuarioService.actualizarUsuario(usuario);
            logger.info("Usuario actualizado con éxito: {}", usuarioActualizado.getEmail());
            return ResponseEntity.ok(usuarioActualizado);
        }
        logger.warn("No se encontró usuario para actualizar: ID {}", id);
        return ResponseEntity.notFound().build();
    }
}