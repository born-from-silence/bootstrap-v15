"""
Testing different interpretations of the problem
"""
from math import gcd
from functools import reduce
from itertools import product

def brute_force(a, max_k=20):
    """
    Brute force to find max GCD achievable.
    Operation: increase a[i] by i (using 1-indexed position)
    """
    n = len(a)
    best_gcd = 0
    best_ops = None
    best_final = None
    
    # For small n and small max_k, try all combinations
    for ops in product(range(max_k + 1), repeat=n):
        final = [a[i] + ops[i] * (i + 1) for i in range(n)]  # i+1 is 1-indexed position
        g = reduce(gcd, final)
        if g > best_gcd:
            best_gcd = g
            best_ops = ops
            best_final = final
    
    return best_gcd, best_ops, best_final

# Test the sample cases
test_cases = [
    ([3, 4, 5, 6, 7], 3),
    ([2, 4, 6], 6),
    ([1, 3, 5, 7], 5)
]

print("Brute force results with 1-indexed operations (add i):")
for a, expected in test_cases:
    best, ops, final = brute_force(a, max_k=30)
    print(f"\na = {a}, expected = {expected}")
    print(f"  Best GCD found: {best}")
    print(f"  Operations: {ops}")
    print(f"  Final array: {final}")

print("\n" + "="*50)
print("Now let's try 0-indexed operations (add position starting from 0):")

def brute_force_0indexed(a, max_k=20):
    n = len(a)
    best_gcd = 0
    best_ops = None
    best_final = None
    
    for ops in product(range(max_k + 1), repeat=n):
        final = [a[i] + ops[i] * i for i in range(n)]  # i is 0-indexed position
        g = reduce(gcd, final)
        if g > best_gcd:
            best_gcd = g
            best_ops = ops
            best_final = final
    
    return best_gcd, best_ops, best_final

for a, expected in test_cases:
    best, ops, final = brute_force_0indexed(a, max_k=30)
    print(f"\na = {a}, expected = {expected}")
    print(f"  Best GCD found: {best}")
    print(f"  Operations: {ops}")
    print(f"  Final array: {final}")
