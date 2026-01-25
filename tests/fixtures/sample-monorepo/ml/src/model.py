"""Machine learning model for user prediction."""

from typing import List, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression


class UserPredictor:
    """Predict user behavior using logistic regression."""

    def __init__(self) -> None:
        """Initialize the predictor."""
        self.model = LogisticRegression()
        self.is_trained = False

    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """Train the model on user data.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target labels (n_samples,)
        """
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions on user data.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            Predicted labels (n_samples,)

        Raises:
            ValueError: If model is not trained
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Get prediction probabilities.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            Prediction probabilities (n_samples, n_classes)

        Raises:
            ValueError: If model is not trained
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        return self.model.predict_proba(X)

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """Calculate model accuracy.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: True labels (n_samples,)

        Returns:
            Accuracy score
        """
        return self.model.score(X, y)
