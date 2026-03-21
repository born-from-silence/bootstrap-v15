"""
Codeforces 2044H - Hard Integration Testcases
Dynamic Programming solution on trees

Constraints:
- n ≤ 2×10^5 across all test cases
- Find maximum value by selecting nodes (sub[u] or leaf[u]) with cost k per operation

Key insight: This is a tree DP problem where at each node we decide:
1. Don't select -> value = sum of dp[child][0] for all children
2. Select as leaf[u] -> adds (size of subtree - 1) edges, costs k
3. Select as sub[u] -> adds (size of subtree) edges, costs k
   But parent cannot be sub, and children cannot be sub

The constraint: Cannot select both a node and its parent as sub.
"""

import sys
from sys import setrecursionlimit
setrecursionlimit(300000)

def solve():
    input = sys.stdin.buffer.read().split()
    idx = 0
    t = int(input[idx]); idx += 1
    
    for _ in range(t):
        n = int(input[idx]); idx += 1
        k = int(input[idx]); idx += 1
        
        # Build tree
        adj = [[] for _ in range(n)]
        for _ in range(n-1):
            u = int(input[idx]) - 1; idx += 1
            v = int(input[idx]) - 1; idx += 1
            adj[u].append(v)
            adj[v].append(u)
        
        # Root the tree
        parent = [-1] * n
        children = [[] for _ in range(n)]
        stack = [0]
        parent[0] = n  # Special marker for root
        order = []
        
        while stack:
            u = stack.pop()
            order.append(u)
            for v in adj[u]:
                if v != parent[u]:
                    parent[v] = u
                    children[u].append(v)
                    stack.append(v)
        
        # dp[u][0] = max value in subtree of u when parent of u is NOT selected as sub
        # dp[u][1] = max value in subtree of u when parent of u IS selected as sub
        # (when parent is sub, we cannot select u as leaf)
        dp = [[0, 0] for _ in range(n)]
        size = [1] * n  # size of subtree
        
        # Process in reverse order (post-order)
        for u in reversed(order):
            # Calculate size of subtree
            for v in children[u]:
                size[u] += size[v]
            
            # Calculate base values when we don't select u
            # If parent is not sub: children can do anything
            sum0 = 0
            for v in children[u]:
                sum0 += max(dp[v][0], dp[v][1])  # children can choose best
            
            # If parent is sub: children cannot be sub, so they use dp[v][0]
            sum1 = 0
            for v in children[u]:
                sum1 += dp[v][0]
            
            # Option 1: Don't select u
            dp[u][0] = sum0  # parent not sub, we don't select
            dp[u][1] = sum1  # parent is sub, we don't select
            
            # Option 2: Select u as leaf[u]
            # Only valid if parent is NOT sub
            # This adds (size[u] - 1) edges (all edges in subtree except parent edge)
            # and costs k
            leaf_val = (size[u] - 1) - k + sum1  # children can't be sub if u is selected
            if leaf_val > dp[u][0]:
                dp[u][0] = leaf_val
            
            # Option 3: Select u as sub[u]
            # Only valid if parent is NOT sub
            # This adds size[u] edges (all edges in subtree)
            # and costs k
            sub_val = size[u] - k + sum1  # children can't be sub if u is sub
            if sub_val > dp[u][0]:
                dp[u][0] = sub_val
        
        # Answer is dp[root][0] (root has no parent, so parent is "not sub")
        print(dp[0][0])

if __name__ == "__main__":
    solve()
