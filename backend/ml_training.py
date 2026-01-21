# ml_training_final.py
"""
Safer & more robust training script:

- Loads dataset (default DATA_PATH set to uploaded file)
- removes duplicate rows
- shows basic dataset stats
- runs Stratified K-Fold CV for each pipeline and prints mean ± std accuracy
- optionally runs a light RandomizedSearchCV for SVM and RandomForest
- selects best pipeline by CV mean accuracy
- performs a stratified train/test split, fits the selected pipeline on X_train and evaluates on X_test
- prints confusion matrix, classification report, ROC AUC (if available)
- prints 5-fold CV score on training data for the selected pipeline (StratifiedKFold)
- saves best_pipeline (trained on X_train) to pipeline.pkl
- saves pipeline metadata in pipeline_metadata.pkl
"""

import warnings
warnings.filterwarnings("ignore")

import os
import pickle
from pprint import pprint
from datetime import datetime

import numpy as np
import pandas as pd

from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score,
    train_test_split,
    RandomizedSearchCV,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
)

# -------------------------
# Config
# -------------------------
# NOTE: this points to the uploaded file in this conversation
DATA_PATH = "heart.csv"

RANDOM_STATE = 42
TEST_SIZE = 0.20
CV_FOLDS = 5
N_JOBS = -1

OUTPUT_PIPELINE = "pipeline.pkl"
OUTPUT_META = "pipeline_metadata.pkl"

# Toggle light hyperparameter tuning for SVM & RF (small randomized search)
DO_RANDOMIZED_SEARCH = True
RANDOM_SEARCH_ITERS = 20  # keep small for speed; increase if you want more thorough search

# -------------------------
# Utility helpers
# -------------------------
def print_header(msg):
    print("\n" + "-" * 60)
    print(msg)
    print("-" * 60 + "\n")


# -------------------------
# Load dataset
# -------------------------
print_header("Loading dataset")
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)
print("Original dataset shape:", df.shape)

# Remove duplicates
before = df.shape[0]
df = df.drop_duplicates()
after = df.shape[0]
print(f"Removed {before - after} duplicate rows. Shape after dedupe: {df.shape}")

if "target" not in df.columns:
    raise ValueError("Expected a column named 'target' in the CSV")

# Basic info
print("\nColumns:", list(df.columns))
print("\nTarget distribution:\n", df["target"].value_counts(normalize=False))

# -------------------------
# Prepare X, y
# -------------------------
X = df.drop(columns=["target"])
y = df["target"].astype(int)

numeric_cols = list(X.columns)

# -------------------------
# Pipelines & models
# -------------------------
print_header("Configuring pipelines")

pipelines = {
    "Logistic Regression": Pipeline(
        [("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=2000, random_state=RANDOM_STATE))]
    ),
    "SVM": Pipeline(
        [("scaler", StandardScaler()), ("clf", SVC(kernel="rbf", probability=True, random_state=RANDOM_STATE))]
    ),
    "KNN": Pipeline([("scaler", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))]),
    "Random Forest": Pipeline(
        [("scaler", StandardScaler()), ("clf", RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE))]
    ),  # scaler is harmless for RF
}

# Optional param distributions for light randomized search
param_distributions = {
    "SVM": {
        "clf__C": [0.01, 0.1, 1, 10, 100],
        "clf__gamma": ["scale", "auto", 0.01, 0.1, 1],
    },
    "Random Forest": {
        "clf__n_estimators": [100, 200, 300],
        "clf__max_depth": [None, 5, 10, 20],
        "clf__min_samples_split": [2, 5, 10],
        "clf__min_samples_leaf": [1, 2, 4],
    },
    # You could add light tuning for LR/KNN if desired
}

# -------------------------
# Cross-validate each pipeline (Stratified K-Fold)
# -------------------------
print_header(f"Running {CV_FOLDS}-fold Stratified CV on each pipeline")
cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

cv_results = {}
for name, pipe in pipelines.items():
    print(f"Evaluating: {name}")
    scores = cross_val_score(pipe, X, y, cv=cv, scoring="accuracy", n_jobs=N_JOBS)
    cv_results[name] = {"cv_mean": float(scores.mean()), "cv_std": float(scores.std()), "cv_scores": scores}
    print(f"  CV accuracy: {scores.mean()*100:.2f}% ± {scores.std()*100:.2f}%")
print("\nDone CV stage.")

# -------------------------
# Optional: RandomizedSearchCV to tune SVM & RF quickly
# -------------------------
tuned_pipelines = {}
if DO_RANDOMIZED_SEARCH:
    print_header("Running light RandomizedSearchCV for SVM and Random Forest (this may take some time)")
    for name in ["SVM", "Random Forest"]:
        base_pipe = pipelines[name]
        if name in param_distributions:
            print(f" Tuning {name} with RandomizedSearchCV (n_iter={RANDOM_SEARCH_ITERS})...")
            rs = RandomizedSearchCV(
                estimator=base_pipe,
                param_distributions=param_distributions[name],
                n_iter=RANDOM_SEARCH_ITERS,
                scoring="accuracy",
                cv=cv,
                random_state=RANDOM_STATE,
                n_jobs=N_JOBS,
                verbose=0,
            )
            rs.fit(X, y)  # tune on full data (CV inside)
            best_est = rs.best_estimator_
            best_score = rs.best_score_
            print(f"  Best CV mean accuracy (during random search) for {name}: {best_score*100:.2f}%")
            # Save the tuned pipeline in the pool (so it competes fairly)
            tuned_name = f"{name} (tuned)"
            pipelines[tuned_name] = best_est
            cv_results[tuned_name] = {"cv_mean": float(best_score), "cv_std": float(0.0)}
            tuned_pipelines[tuned_name] = best_est
        else:
            print(f"  No param distribution provided for {name}; skipping tuning.")
    print("RandomizedSearchCV stage complete.")

# -------------------------
# Recompute CV results for any newly added tuned pipelines (if any)
# -------------------------
print_header("Final CV table (mean ± std)")
final_table = []
for name, pipe in pipelines.items():
    # If cv_results already contains results (from earlier) and pipeline unchanged, use it; else compute.
    if name in cv_results and "cv_scores" in cv_results[name]:
        mean = cv_results[name]["cv_mean"]
        std = cv_results[name]["cv_std"]
    else:
        scores = cross_val_score(pipe, X, y, cv=cv, scoring="accuracy", n_jobs=N_JOBS)
        mean, std = float(scores.mean()), float(scores.std())
    final_table.append((name, mean, std))

# Sort by mean descending
final_table.sort(key=lambda t: t[1], reverse=True)

for name, mean, std in final_table:
    print(f"{name:25s} : {mean*100:6.2f}% ± {std*100:5.2f}%")

# -------------------------
# Select best pipeline by CV mean accuracy
# -------------------------
best_name, best_mean, best_std = final_table[0]
best_pipeline = pipelines[best_name]
print_header(f"Selected best pipeline: {best_name} (CV mean {best_mean*100:.2f}% ± {best_std*100:.2f}%)")

# -------------------------
# Final held-out evaluation: stratified train/test split
# -------------------------
print_header("Final held-out evaluation (stratified split)")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")

# Fit best pipeline on X_train
best_pipeline.fit(X_train, y_train)

# Predict on train/test (to detect overfitting)
y_train_pred = best_pipeline.predict(X_train)
y_test_pred = best_pipeline.predict(X_test)
train_acc = accuracy_score(y_train, y_train_pred)
test_acc = accuracy_score(y_test, y_test_pred)

print(f"Train accuracy (best pipeline): {train_acc*100:.2f}%")
print(f"Test  accuracy (best pipeline): {test_acc*100:.2f}%")

# Confusion matrix & classification report on test
print("\nConfusion Matrix (test):")
print(confusion_matrix(y_test, y_test_pred))

print("\nClassification Report (test):")
print(classification_report(y_test, y_test_pred))

# If pipeline supports predict_proba, compute ROC AUC
y_test_proba = None
try:
    y_test_proba = best_pipeline.predict_proba(X_test)[:, 1]
except Exception:
    y_test_proba = None

if y_test_proba is not None:
    try:
        roc = roc_auc_score(y_test, y_test_proba)
        print(f"ROC AUC (test): {roc:.4f}")
    except Exception:
        pass
else:
    print("predict_proba not available for the selected pipeline; skipping ROC AUC.")

# -------------------------
# Cross-validate the chosen pipeline on the training set (inside-training estimate)
# -------------------------
print_header(f"{CV_FOLDS}-fold CV of chosen pipeline on the TRAINING set")
cv_on_train = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
cv_scores_train = cross_val_score(best_pipeline, X_train, y_train, cv=cv_on_train, scoring="accuracy", n_jobs=N_JOBS)
print(f"  CV on TRAINING set: {cv_scores_train.mean()*100:.2f}% ± {cv_scores_train.std()*100:.2f}%")

# -------------------------
# Save the best pipeline (fitted on X_train) and metadata
# -------------------------
print_header("Saving pipeline and metadata")
with open(OUTPUT_PIPELINE, "wb") as f:
    pickle.dump(best_pipeline, f)

meta = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "data_path": DATA_PATH,
    "removed_duplicates": int(before - after),
    "feature_columns": numeric_cols,
    "best_model_name": best_name,
    "cv_mean_accuracy": float(best_mean),
    "cv_std_accuracy": float(best_std),
    "train_accuracy": float(train_acc),
    "test_accuracy": float(test_acc),
    "cv_train_mean_accuracy": float(cv_scores_train.mean()),
    "n_samples": int(X.shape[0]),
    "random_state": RANDOM_STATE,
}

with open(OUTPUT_META, "wb") as f:
    pickle.dump(meta, f)

print(f"Saved pipeline to: {OUTPUT_PIPELINE}")
print(f"Saved metadata to: {OUTPUT_META}")
print("\nAll done. Review outputs and logs above to verify behavior.")
