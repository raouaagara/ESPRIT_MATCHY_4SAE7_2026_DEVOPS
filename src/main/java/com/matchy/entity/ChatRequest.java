package com.matchy.entity;

import java.util.List;

public class ChatRequest {
    private List<ChatMessage> history;

    public ChatRequest() {}

    public List<ChatMessage> getHistory() { return history; }
    public void setHistory(List<ChatMessage> history) { this.history = history; }
}