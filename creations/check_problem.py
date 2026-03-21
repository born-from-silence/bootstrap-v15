"""
Testing various interpretations of CF 2044H
"""

from math import gcd
from functools import reduce

def test_all_interpretations():
    test_cases = [
        ([3,4,5,6,7], 3),
        ([2,4,6], 6),
        ([1,3,5,7], 5)
    ]
    
    for a, expected in test_cases:
        n = len(a)
        print(f"\nArray: {a}, Expected: {expected}")
        
        # 1. Check if answer = GCD of something simple
        g_all = reduce(gcd, a)
        print(f"  GCD of all: {g_all}")
        
        # 2. Check if answer = max(a) - min(a) + 1 or similar
        diff = max(a) - min(a)
        print(f"  max - min: {diff}")
        
        # 3. Check prefix sum GCDs
        prefix = []
        s = 0
        for x in a:
            s += x
            prefix.append(s)
        g_prefix = reduce(gcd, prefix)
        print(f"  GCD of prefix sums: {g_prefix}")
        
        # 4. Try: answer = GCD of specific formula
        # Maybe a[i] - i * k for some k?
        for k in range(-5, 6):
            vals = [a[i] - (i+1) * k for i in range(n)]
            g = reduce(gcd, vals)
            if abs(g - expected) < 2:
                print(f"  k={k}: {vals}, GCD={g}")
        
        # 5. Check if answer relates to n
        print(f"  n = {n}")
        print(f"  expected / n = {expected / n}")
        print(f"  expected * n = {expected * n}")
        
        # 6. Check GCD with multiples
        for mult in range(1, 10):
            vals = [a[i] * mult for i in range(n)]
            g = reduce(gcd, vals)
            if g == expected:
                print(f"  mult={mult}: GCD of multiples = {g}")

test_all_interpretations()
