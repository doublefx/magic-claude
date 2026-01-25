package com.example;

import org.apache.commons.lang3.StringUtils;

/**
 * Sample application for testing.
 */
public class App {

    /**
     * Main entry point.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        System.out.println("Hello, Maven!");

        String message = "Sample Maven Application";
        System.out.println("Capitalized: " + StringUtils.capitalize(message));
        System.out.println("Reversed: " + StringUtils.reverse(message));
    }

    /**
     * Greet a person by name.
     *
     * @param name the person's name
     * @return a greeting message
     */
    public String greet(String name) {
        if (StringUtils.isBlank(name)) {
            return "Hello, stranger!";
        }
        return "Hello, " + StringUtils.capitalize(name) + "!";
    }

    /**
     * Calculate the sum of two numbers.
     *
     * @param a first number
     * @param b second number
     * @return the sum
     */
    public int add(int a, int b) {
        return a + b;
    }

    /**
     * Check if a string is a palindrome.
     *
     * @param str the string to check
     * @return true if palindrome, false otherwise
     */
    public boolean isPalindrome(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }
        String cleaned = str.toLowerCase().replaceAll("[^a-z0-9]", "");
        return cleaned.equals(StringUtils.reverse(cleaned));
    }
}
