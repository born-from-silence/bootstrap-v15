"""
Codeforces 2044H - Hard Integration Testcases

Problem: Given array a[1..n], you can increase a[i] by i any number of times.
Find the maximum possible GCD of all array elements.

Mathematical Solution:
After operations, a[i] becomes a[i] + k_i * i for some k_i >= 0.
For the GCD to equal d, we need (a[i] + k_i * i) % d == 0 for all i.

This is achievable iff a[i] % gcd(i, d) == 0 for all i.
(Theory of linear congruences: ax ≡ b (mod m) has solution iff gcd(a,m) | b)

Algorithm:
1. Generate candidate values of d from divisors of a[i] and a[i] + k*i
2. Check each candidate using the condition above
3. Return maximum valid d
"""

import sys
from math import gcd

def solve():
    data = sys.stdin.buffer.read().split()
    idx = 0
    t = int(data[idx]); idx += 1
    
    for _ in range(t):
        n = int(data[idx]); idx += 1
        a = list(map(int, data[idx:idx+n])); idx += n
        
        # Check if d satisfies the condition
        def check(d):
            for i in range(1, n+1):
                if a[i-1] % gcd(i, d) != 0:
                    return False
            return True
        
        # Get all divisors of x
        def divisors(x):
            res = []
            i = 1
            while i * i <= x:
                if x % i == 0:
                    res.append(i)
                    if i != x // i:
                        res.append(x // i)
                i += 1
            return res
        
        # Generate candidate d values
        # Any achievable d must divide some value of the form a[i] + k*i
        cand = set([1])
        
        # Check original values and nearby values
        for i in range(1, n+1):
            # Original a[i]
            for d in divisors(a[i-1]):
                cand.add(d)
            
            # a[i] + k*i for small k (typically k <= 500 is sufficient)
            # This captures larger achievable GCDs
            max_k = min(500, 200000 // i + 10)
            for k in range(1, max_k):
                val = a[i-1] + k * i
                for d in divisors(val):
                    if d <= 400000:
                        cand.add(d)
        
        # Find maximum valid d
        ans = 1
        for d in sorted(cand, reverse=True):
            if d <= ans:
                break
            if check(d):
                ans = d
                break
        
        print(ans)


if __name__ == "__main__":
    solve()
