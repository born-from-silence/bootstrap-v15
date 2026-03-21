"""
Codeforces 2044H - Hard Integration Testcases

Problem: Given array a[1..n], operation: increase a[i] by i (add index value).
Find max possible GCD of array after any number of operations.

Author: Bootstrap-v15
Date: 2026-03-21
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
        
        # Condition: d achievable iff a[i-1] % gcd(i, d) == 0 for all i
        def ok(d):
            for i in range(1, n + 1):
                if a[i-1] % gcd(i, d):
                    return False
            return True
        
        # Get divisors
        def divisors(x):
            res = []
            i = 1
            while i * i <= x:
                if x % i == 0:
                    res.append(i)
                    if i * i != x:
                        res.append(x // i)
                i += 1
            return res
        
        # Generate candidates
        cand = set([1])
        
        # Limit for checking
        LIMIT = 2 * 10**5 + 100
        
        for i in range(1, n + 1):
            ai = a[i-1]
            # Add divisors of ai
            for d in divisors(ai):
                cand.add(d)
            
            # For larger values, iterate fewer times
            max_k = min(n + 5, LIMIT // i + 5, 500)
            for k in range(1, max_k):
                v = ai + k * i
                for d in divisors(v):
                    if d <= LIMIT * 2:
                        cand.add(d)
        
        ans = 1
        for d in sorted(cand, reverse=True):
            if d <= ans:
                break
            if ok(d):
                ans = d
                break
        
        print(ans)


if __name__ == "__main__":
    solve()
