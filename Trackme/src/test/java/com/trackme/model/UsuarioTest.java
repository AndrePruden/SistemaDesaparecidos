package com.trackme.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UsuarioTest {

    @Test
    void testConstructorYGettersSetters() {
        String username = "user1";
        String password = "password123";
        String email = "user1@domain.com";

        Usuario usuario = new Usuario(username, password, email);

        assertEquals(username, usuario.getNombre());
        assertEquals(password, usuario.getPassword());
        assertEquals(email, usuario.getEmail());
    }

    @Test
    void testSettersYGetters() {
        Usuario usuario = new Usuario();
        usuario.setUsername("newuser");
        usuario.setPassword("newpassword123");
        usuario.setEmail("newuser@domain.com");

        assertEquals("newuser", usuario.getNombre());
        assertEquals("newpassword123", usuario.getPassword());
        assertEquals("newuser@domain.com", usuario.getEmail());
    }
}
