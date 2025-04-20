package com.trackme.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResponseMessageTest {

    @Test
    void testConstructorAndGetter() {
        String expectedMessage = "Operación exitosa";
        ResponseMessage responseMessage = new ResponseMessage(expectedMessage);

        assertNotNull(responseMessage);
        assertEquals(expectedMessage, responseMessage.getMessage());
    }

    @Test
    void testEmptyMessage() {
        ResponseMessage responseMessage = new ResponseMessage("");
        assertEquals("", responseMessage.getMessage());
    }

    @Test
    void testNullMessage() {
        ResponseMessage responseMessage = new ResponseMessage(null);
        assertNull(responseMessage.getMessage());
    }
}
