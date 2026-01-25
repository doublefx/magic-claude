package com.example;

import com.google.gson.Gson;
import java.util.HashMap;
import java.util.Map;

/**
 * Simple API service.
 */
public class Api {

    private final Gson gson = new Gson();

    /**
     * Get user by ID.
     *
     * @param userId the user ID
     * @return JSON representation of user
     */
    public String getUser(String userId) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", userId);
        user.put("name", "Sample User");
        user.put("email", "user@example.com");
        return gson.toJson(user);
    }

    /**
     * Create a new user.
     *
     * @param name user's name
     * @param email user's email
     * @return JSON representation of created user
     */
    public String createUser(String name, String email) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", generateId());
        user.put("name", name);
        user.put("email", email);
        return gson.toJson(user);
    }

    private String generateId() {
        return "user-" + System.currentTimeMillis();
    }
}
