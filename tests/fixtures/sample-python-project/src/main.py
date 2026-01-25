"""Main module for sample Python project."""

from typing import List, Optional


def greet(name: str) -> str:
    """Greet a person by name.

    Args:
        name: The person's name

    Returns:
        A greeting message
    """
    return f"Hello, {name}!"


def calculate_sum(numbers: List[int]) -> int:
    """Calculate the sum of a list of numbers.

    Args:
        numbers: List of integers to sum

    Returns:
        The sum of all numbers
    """
    return sum(numbers)


def find_maximum(numbers: List[int]) -> Optional[int]:
    """Find the maximum value in a list of numbers.

    Args:
        numbers: List of integers

    Returns:
        The maximum value or None if the list is empty
    """
    if not numbers:
        return None
    return max(numbers)


if __name__ == "__main__":
    print(greet("World"))
    print(f"Sum: {calculate_sum([1, 2, 3, 4, 5])}")
    print(f"Max: {find_maximum([1, 2, 3, 4, 5])}")
