"""
Codeforces 2044H - Hard Integration Testcases

After extensive analysis, the problem is:
Given array a[1..n], operation: choose index i, increase a[i] by i.
Find maximum possible GCD of array after operations.

Mathematical Analysis:
- After operations: a[i] becomes a[i] + k_i * i for k_i >= 0
- For GCD = d, need a[i] + k_i * i ≡ 0 (mod d) for all i
- This requires: gcd(i, d) | a[i] for each i (necessary condition)
- Equivalently: a[i] % gcd(i, d) == 0 for all i

Algorithm:
1. Generate candidate d values from divisors of reachable values
2. Verify each candidate using the condition above
3. Return maximum valid d

Note: Based on mathematical analysis, this should be correct, but sample
outputs may vary depending on exact problem interpretation.
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
        
        # Condition: d is achievable iff for all i: a[i-1] % gcd(i, d) == 0
        def is_valid(d):
            for i in range(1, n+1):
                if a[i-1] % gcd(i, d) != 0:
                    return False
            return True
        
        # Get divisors of x
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
        
        # Generate candidates
        # Any achievable d must be a divisor of some a[i] + k*i
        candidates = set([1])
        
        # Check divisors of a[i] and nearby values
        for i in range(1, n+1):
            # Original value
            for d in get_divisors(a[i-1]):
                candidates.add(d)
            
            # Values reachable with small k (captures larger d)
            max_k = min(1000, 200000 // i + 5)
            for k in range(1, max_k):
                val = a[i-1] + k * i
                for d in get_divisors(val):
                    if d <= 500000:  # Reasonable upper bound
                        candidates.add(d)
        
        # Also check some multiples of GCDs
        cur_gcd = 0
        for x in a:
            cur_gcd = gcd(cur_gcd, x)
        for d in get_divisors(cur_gcd):
            candidates.add(d)
        
        # Find maximum valid
        ans = 1
        for d in sorted(candidates, reverse=True):
            if d <= ans:
                break
            if is_valid(d):
                ans = d
                break
        
        print(ans)


if __name__ == "__main__":
    solve()
