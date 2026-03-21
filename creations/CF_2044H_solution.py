"""
Codeforces 2044H - Hard Integration Testcases
Solution: Maximize GCD after operations

Problem: Given array a[1..n], operation: increase a[i] by i (1-indexed)
Find maximum possible GCD of array after any number of operations.

Mathematical Condition:
For GCD = d to be achievable, we need for all positions i:
    gcd(i, d) | a[i]

Because we need to find k such that (a[i] + k*i) % d == 0
This is solvable iff a[i] % gcd(i, d) == 0
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
        
        # Check if d is achievable
        def is_achievable(d):
            for i in range(1, n+1):  # i is 1-indexed
                g = gcd(i, d)
                if a[i-1] % g != 0:
                    return False
            return True
        
        # Get divisors
        def get_divisors(x):
            if x <= 0:
                return []
            divs = []
            i = 1
            while i * i <= x:
                if x % i == 0:
                    divs.append(i)
                    if i * i != x:
                        divs.append(x // i)
                i += 1
            return divs
        
        # Generate candidates: divisors of a[i] + k*i for reasonable k
        candidates = set([1])
        MAX_K = 500  # Reasonable bound
        
        for i in range(1, n+1):
            ai = a[i-1]
            # Add divisors of original and nearby values
            for k in range(MAX_K):
                val = ai + k * i
                for d in get_divisors(val):
                    candidates.add(d)
        
        # Find maximum valid d
        ans = 1
        for d in sorted(candidates, reverse=True):
            if d <= ans:
                break
            if is_achievable(d):
                ans = d
                break
        
        print(ans)


if __name__ == "__main__":
    solve()
