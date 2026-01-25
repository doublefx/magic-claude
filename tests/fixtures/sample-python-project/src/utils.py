"""Utility functions for sample Python project."""

from typing import Dict, Any, List


def validate_email(email: str) -> bool:
    """Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    return "@" in email and "." in email.split("@")[1]


def parse_config(config_str: str) -> Dict[str, Any]:
    """Parse configuration string.

    Args:
        config_str: Configuration string in key=value format

    Returns:
        Dictionary of configuration values
    """
    config = {}
    for line in config_str.strip().split("\n"):
        if "=" in line:
            key, value = line.split("=", 1)
            config[key.strip()] = value.strip()
    return config


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split a list into chunks of specified size.

    Args:
        items: List to chunk
        chunk_size: Size of each chunk

    Returns:
        List of chunks
    """
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
