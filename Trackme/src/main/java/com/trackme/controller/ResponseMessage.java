package com.trackme.controller;

public class ResponseMessage {

    private String message;

    public ResponseMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMensaje(String mensaje) { this.message = mensaje; }
}

