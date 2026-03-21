"""
Codeforces 2044H - Hard Integration Testcases

Problem: Given array a[1..n], operation: increase a[i] by i.
Find maximum possible GCD of array after operations.

Key Mathematical Result:
For GCD = d to be achievable, for each position i:
    a[i] % gcd(i, d) == 0

This is because we need k such that (a[i] + k*i) % d == 0,
and this has solution iff a[i] % gcd(i, d) == 0.

Solution Approach:
1. For each possible g = gcd(i, d), we need a[i] % g == 0
2. Iterate over candidate d values and verify the condition
3. Return the maximum valid d
"""

import sys
from math import gcd

def solve():
    input = sys.stdin.buffer.read().split()
    p = 0
    t = int(input[p]); p += 1
    
    for _ in range(t):
        n = int(input[p]); p += 1
        a = list(map(int, input[p:p+n])); p += n
        
        # Condition: d achievable iff for all i: a[i-1] % gcd(i, d) == 0
        def valid(d):
            for i in range(1, n+1):
                if a[i-1] % gcd(i, d) != 0:
                    return False
            return True
        
        # Get divisors of x
        def divs(x):
            res = []
            i = 1
            while i * i <= x:
                if x % i == 0:
                    res.append(i)
                    if i != x // i:
                        res.append(x // i)
                i += 1
            return res
        
        # Generate candidates: any achievable d must divide some a[i] + k*i
        candidates = set([1])
        
        # For efficiency, we check divisors of values near a[i]
        # and of the form a[i] + k*i (small k)
        for i in range(1, n+1):
            for k in range(200):  # Small k is usually sufficient
                val = a[i-1] + k * i
                for d in divs(val):
                    candidates.add(d)
        
        ans = 1
        for d in sorted(candidates, reverse=True):
            if d <= ans:
                break
            if valid(d):
                ans = d
                break
        
        print(ans)


if __name__ == "__main__":
    solve()
