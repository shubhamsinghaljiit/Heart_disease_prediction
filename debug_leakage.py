# debug_leakage.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

DATA_PATH = "heart.csv"
df = pd.read_csv(DATA_PATH)
print("Dataset shape:", df.shape)
print("Columns:", df.columns.tolist())

# 1) basic class balance
print("\nClass distribution (target):")
print(df['target'].value_counts(dropna=False))

# 2) duplicate rows in full dataset
dup_all = df.duplicated().sum()
print(f"\nDuplicate rows in entire dataframe: {dup_all}")

# 3) any column identical to target?
same_as_target = []
for col in df.columns:
    if col == 'target':
        continue
    # compare values (allow numeric/string)
    if df[col].equals(df['target']):
        same_as_target.append(col)
print("\nColumns identical to target:", same_as_target)

# 4) quick check for columns that perfectly separate classes
separators = []
for col in df.columns:
    if col == 'target':
        continue
    # skip if non-numeric? we'll still try
    groups = df.groupby('target')[col].nunique()
    # if one class has zero unique and the other single unique, suspicious
    if groups.sum() == groups.max():
        separators.append((col, groups.to_dict()))
print("\nColumns with suspiciously small unique values by class (possible separator):", separators)

# 5) split then check overlap between train and test rows (on all feature columns)
X = df.drop(columns=['target'])
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
train = X_train.copy(); train['target'] = y_train
test = X_test.copy(); test['target'] = y_test

# Count exact identical rows between train and test (all columns)
merged = pd.merge(train, test, how='inner', on=list(df.columns))
print("\nExact identical rows between train and test (should be 0):", len(merged))

# 6) If some duplicates shared across split, show examples
if len(merged) > 0:
    print("\nExamples of overlapping rows:")
    print(merged.head())

# 7) Train a RandomForest on train and print top feature importances
rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_train, y_train)
importances = rf.feature_importances_
feat_imp = sorted(zip(X.columns.tolist(), importances), key=lambda x: x[1], reverse=True)
print("\nTop feature importances (RandomForest trained on train set):")
for name, imp in feat_imp:
    print(f"  {name}: {imp:.4f}")

# 8) Check for constant columns
const_cols = [c for c in X.columns if df[c].nunique() <= 1]
print("\nConstant columns (nunique <= 1):", const_cols)

# 9) Summary done
print("\n--- Diagnostic checks complete ---")
