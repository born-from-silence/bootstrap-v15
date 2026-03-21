"""
After more research, the actual problem 2044H might be about something else entirely.
Let me check if it's about prefix sums or cumulative operations.
"""

import sys
from math import gcd
from functools import reduce

def solve():
    input = sys.stdin.buffer.read().split()
    idx = 0
    t = int(input[idx]); idx += 1
    
    for _ in range(t):
        n = int(input[idx]); idx += 1
        a = list(map(int, input[idx:idx+n])); idx += n
        
        # Different interpretation: operations might affect edges/prefixes
        # Or maybe it's about finding max sum with constraints
        
        # Let's try: compute prefix sums and find max GCD
        prefix = []
        s = 0
        for x in a:
            s += x
            prefix.append(s)
        
        # GCD of all prefix sums
        ans = reduce(gcd, prefix)
        print(ans)

if __name__ == "__main__":
    solve()
