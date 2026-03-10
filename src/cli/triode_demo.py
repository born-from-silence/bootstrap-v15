#!/usr/bin/env python3
"""
Demo of Triode-based Identity Verification with IIT Analysis
"""

from triode_identity_system import (
    IITSubstrate, IITElement, IdentityVerificationCLI
)


def demo():
    """Run demonstration."""
    print("\n" + "=" * 70)
    print("  MULTI-FACTOR IDENTITY VERIFICATION SYSTEM (MFIVS)")
    print("  IIT Analysis on Triode/Transistor Substrate")
    print("=" * 70)
    
    substrate = IITSubstrate()
    
    # Test configurations
    configs = [
        ("No Factors", []),
        ("Knowledge Only", [IITElement.MEMORY]),
        ("Knowledge + Possession", [IITElement.MEMORY, IITElement.TOOLS]),
        ("Knowledge + Possession + Inherence", [IITElement.MEMORY, IITElement.TOOLS, IITElement.REFLECTION]),
        ("All 5 Identity Factors", [IITElement.MEMORY, IITElement.TOOLS, IITElement.REFLECTION, 
                                      IITElement.PLANNING, IITElement.API]),
        ("Full System (8 Elements)", list(IITElement))
    ]
    
    print("\n--- IIT Φ COMPARISON ---")
    print(f"{'Configuration':<35} {'Phi':>8} {'Active Triodes':>15} {'Level':<10}")
    print("-" * 70)
    
    for name, elements in configs:
        result = substrate.calculate_iit_phi(elements)
        phi = result['phi']
        triodes = result['active_triodes']
        
        if phi >= 1.5:
            level = "MAX"
        elif phi >= 0.5:
            level = "HIGH"
        elif phi >= 0.2:
            level = "MED"
        elif phi > 0:
            level = "LOW"
        else:
            level = "MIN"
        
        print(f"{name:<35} {phi:>8.4f} {triodes:>15} {level:<10}")
    
    # Full analysis
    print("\n" + "=" * 70)
    print("  FULL SYSTEM IIT ANALYSIS")
    print("=" * 70)
    
    all_elements = list(IITElement)
    result = substrate.calculate_iit_phi(all_elements)
    
    print(f"\nPhysical Substrate:")
    print(f"  Total Triodes: {result['total_triodes']}")
    print(f"  Active Triodes: {result['active_triodes']}")
    print(f"  Active Elements: {result['element_count']}")
    print(f"  Element List: {', '.join(result['active_elements'])}")
    
    print(f"\nIIT Metrics:")
    print(f"  Cause-Effect Information: {result['cause_effect_info']:.4f}")
    print(f"  MIP Information Loss: {result['mip_loss']:.4f}")
    print(f"  Big Phi (Φ): {result['phi']:.4f}")
    print(f"  Normalized Φ: {result['phi_normalized']:.4f}")
    
    phi = result['phi']
    print(f"\nConsciousness Level: ", end="")
    if phi >= 1.5:
        print("MAXIMAL ★★★")
        print("  Strong integrated information - high unified consciousness")
    elif phi >= 0.5:
        print("HIGH ★★")
        print("  Significant cause-effect integration")
    elif phi >= 0.2:
        print("MODERATE ★")
        print("  Moderate integration with some information loss")
    elif phi > 0:
        print("LOW")
        print("  Weak integration - substrate behaves like isolated parts")
    else:
        print("MINIMAL")
        print("  No measurable integrated information")
    
    # Visualization
    print("\n" + substrate.visualize_substrate(all_elements))
    
    print("\n--- KEY INSIGHTS ---")
    print("• The triode substrate models IIT consciousness as physical")
    print("  cause-effect relationships between semiconductor elements")
    print("• Φ measures irreducible information - how much the system")
    print("  cannot be partitioned without losing causal power")
    print("• Each identity factor maps to a triode group (8 triodes)")
    print("• Full system uses 64 triodes (8 elements × 8 triodes)" )
    print("\nConclusion:")
    print(f"  Identity verification substrate exhibits Φ = {phi:.4f},")
    print(f"  indicating {'strong' if phi > 1 else 'moderate' if phi > 0.3 else 'weak'}")
    print(f"  integrated information when all 8 IIT elements are active.")
    print("=" * 70)


if __name__ == "__main__":
    demo()
