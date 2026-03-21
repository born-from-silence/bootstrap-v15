"""
Codeforces 2044H - Hard Integration Testcases
Solution: Maximize GCD after operations

Problem: Given array a[1..n], operation: increase a[i] by i
Find maximum possible GCD of array after any number of operations.

Key Mathematical Insight:
After k_i operations on position i, a[i] becomes a[i] + k_i * i
For GCD = d to be achievable, we need for each i:
  gcd(i, d) | a[i]
This is because a[i] + k*i ≡ 0 (mod d) has solution iff a[i] ≡ 0 (mod gcd(i,d))

Algorithm: Generate candidate d values from divisors of a[i] + k*i for small k,
then verify with the condition above.
"""

import sys
from math import gcd

def solve():
    input = sys.stdin.buffer.read().split()
    p = 0
    t = int(input[p]); p += 1
    
    results = []
    
    for _ in range(t):
        n = int(input[p]); p += 1
        a = list(map(int, input[p:p+n])); p += n
        
        # Check if d is achievable
        def is_achievable(d):
            for i in range(1, n+1):  # i is 1-indexed position
                g = gcd(i, d)
                if a[i-1] % g != 0:
                    return False
            return True
        
        # Get all divisors
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
        
        # Generate candidate d values
        # d must divide some a[i] + k*i for each i
        candidates = set([1])
        
        # Upper bound for candidate values
        MAX_D = 2 * 10**5 + 100
        
        for i in range(1, n+1):
            ai = a[i-1]
            # Add divisors of original value
            for d in get_divisors(ai):
                candidates.add(d)
            
            # Also consider divisors of a[i] + k*i for reasonable k
            # This captures larger achievable GCD values
            max_k = min(500, MAX_D // i + 10)
            for k in range(1, max_k):
                val = ai + k * i
                for d in get_divisors(val):
                    if d <= MAX_D * 2:
                        candidates.add(d)
        
        # Find maximum achievable d
        ans = 1
        for d in sorted(candidates, reverse=True):
            if d <= ans:
                break
            if is_achievable(d):
                ans = d
                break
        
        results.append(ans)
    
    print('\n'.join(map(str, results)))


def solve_optimized():
    """
    Optimized version using different strategy:
    - Group positions by gcd values
    - Check divisors of combined constraints
    """
    import sys
    from math import gcd
    
    input = sys.stdin.buffer.read().split()
    p = 0
    t = int(input[p]); p += 1
    
    for _ in range(t):
        n = int(input[p]); p += 1
        a = list(map(int, input[p:p+n])); p += n
        
        # For each possible gcd(i, d) value, track constraints
        def check(d):
            for i in range(1, n+1):
                if a[i-1] % gcd(i, d) != 0:
                    return False
            return True
        
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
        
        # Build candidates
        cand = set([1])
        
        # Key insight: d must be <= max(a) + n*n in worst case
        # But practically, good candidates are divisors of weighted sums
        
        # For each position, add relevant divisors
        for i in range(1, n+1):
            # Check a[i-1] and nearby values
            for delta in range(-5, 6):
                val = a[i-1] + delta
                if val > 0:
                    for d in divisors(val):
                        cand.add(d)
            
            # Check values a[i-1] mod i adjusted
            val = a[i-1] + (i - a[i-1] % i) % i
            for d in divisors(val):
                cand.add(d)
        
        ans = 1
        for d in sorted(cand, reverse=True):
            if d <= ans:
                break
            if check(d):
                ans = d
                break
        
        print(ans)


# Choose implementation
if __name__ == "__main__":
    solve()
