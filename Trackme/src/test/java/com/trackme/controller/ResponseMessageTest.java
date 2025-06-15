package com.trackme.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResponseMessageTest {

    @Test
    void constructor_CreatesMessageCorrectly() {
        String mensaje = "Mensaje de prueba";

        ResponseMessage responseMessage = new ResponseMessage(mensaje);

        assertEquals(mensaje, responseMessage.getMessage());
    }

    @Test
    void getMessage_ReturnsCorrectMessage() {
        String mensaje = "Test message";
        ResponseMessage responseMessage = new ResponseMessage(mensaje);

        String result = responseMessage.getMessage();

        assertEquals(mensaje, result);
    }

    @Test
    void setMensaje_UpdatesMessageCorrectly() {
        ResponseMessage responseMessage = new ResponseMessage("Mensaje inicial");
        String nuevoMensaje = "Mensaje actualizado";

        responseMessage.setMensaje(nuevoMensaje);

        assertEquals(nuevoMensaje, responseMessage.getMessage());
    }

    @Test
    void constructor_WithNullMessage_DoesNotThrowException() {
        assertDoesNotThrow(() -> new ResponseMessage(null));

        ResponseMessage responseMessage = new ResponseMessage(null);
        assertNull(responseMessage.getMessage());
    }

    @Test
    void constructor_WithEmptyMessage_WorksCorrectly() {
        String emptyMessage = "";

        ResponseMessage responseMessage = new ResponseMessage(emptyMessage);

        assertEquals(emptyMessage, responseMessage.getMessage());
    }
}