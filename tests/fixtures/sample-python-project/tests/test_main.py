"""Tests for main module."""

import pytest
from src.main import greet, calculate_sum, find_maximum


def test_greet():
    """Test greet function."""
    assert greet("Alice") == "Hello, Alice!"
    assert greet("Bob") == "Hello, Bob!"


def test_calculate_sum():
    """Test calculate_sum function."""
    assert calculate_sum([1, 2, 3]) == 6
    assert calculate_sum([]) == 0
    assert calculate_sum([10]) == 10


def test_find_maximum():
    """Test find_maximum function."""
    assert find_maximum([1, 5, 3, 2]) == 5
    assert find_maximum([10]) == 10
    assert find_maximum([]) is None
    assert find_maximum([-1, -5, -3]) == -1
