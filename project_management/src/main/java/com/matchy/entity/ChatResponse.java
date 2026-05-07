package com.matchy.entity;

public class ChatResponse {
    private String text;
    private boolean success;
    private String error;

    public ChatResponse() {}

    public ChatResponse(String text) {
        this.text = text;
        this.success = true;
    }

    public ChatResponse(String error, boolean success) {
        this.error = error;
        this.success = false;
        this.text = error;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}