package com.example;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for App class.
 */
class AppTest {

    private App app;

    @BeforeEach
    void setUp() {
        app = new App();
    }

    @Test
    void testGreetWithName() {
        assertEquals("Hello, Alice!", app.greet("alice"));
        assertEquals("Hello, Bob!", app.greet("bob"));
    }

    @Test
    void testGreetWithEmptyName() {
        assertEquals("Hello, stranger!", app.greet(""));
        assertEquals("Hello, stranger!", app.greet(null));
        assertEquals("Hello, stranger!", app.greet("   "));
    }

    @Test
    void testAdd() {
        assertEquals(5, app.add(2, 3));
        assertEquals(0, app.add(-5, 5));
        assertEquals(-10, app.add(-5, -5));
    }

    @Test
    void testIsPalindrome() {
        assertTrue(app.isPalindrome("racecar"));
        assertTrue(app.isPalindrome("A man a plan a canal Panama"));
        assertTrue(app.isPalindrome("Was it a car or a cat I saw"));

        assertFalse(app.isPalindrome("hello"));
        assertFalse(app.isPalindrome(""));
        assertFalse(app.isPalindrome(null));
    }
}
