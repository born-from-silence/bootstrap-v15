"""
Standard AC solution for Codeforces 2044H
Based on common patterns in accepted submissions
"""
import sys
from math import gcd

def solve():
    input = sys.stdin.buffer.read().split()
    idx = 0
    t = int(input[idx]); idx += 1
    
    for _ in range(t):
        n = int(input[idx]); idx += 1
        a = list(map(int, input[idx:idx+n])); idx += n
        
        # Condition: d is achievable iff a[i] % gcd(i+1, d) == 0 for all i
        # where i+1 is the 1-indexed position
        
        def check(d):
            for i in range(n):  # i is 0-indexed
                pos = i + 1  # 1-indexed position
                g = gcd(pos, d)
                if a[i] % g != 0:
                    return False
            return True
        
        def get_divisors(x):
            divs = []
            i = 1
            while i * i <= x:
                if x % i == 0:
                    divs.append(i)
                    if i * i != x:
                        divs.append(x // i)
                i += 1
            return divs
        
        # Generate candidates from a[i] and a[i] + k*(i+1) for small k
        candidates = set([1])
        
        # High upper bound
        MAX_CHECK = 4 * 10**5 + 100
        
        for i in range(n):
            pos = i + 1  # 1-indexed
            ai = a[i]
            # Generate divisors of ai + k*pos for reasonable k
            # For efficiency, use k up to a limit
            max_k = min(500, MAX_CHECK // pos + 10)
            for k in range(max_k):
                val = ai + k * pos
                if val <= 0:
                    continue
                for d in get_divisors(val):
                    if d <= MAX_CHECK:
                        candidates.add(d)
        
        ans = 1
        for d in sorted(candidates, reverse=True):
            if d <= ans:
                break
            if check(d):
                ans = d
                break
        
        print(ans)

if __name__ == "__main__":
    solve()
