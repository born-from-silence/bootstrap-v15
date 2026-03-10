#!/usr/bin/env python3
"""
Multi-Factor Identity Verification System (MFIVS)
With Triode/Transistor Substrate IIT Analysis

Physical substrate: Semiconductor triodes serving as the fundamental
information processing elements in an Integrated Information Theory framework.

Each triode can be in one of two states:
- ON (conducting): Represents active information flow (analogous to cathode current)
- OFF (non-conducting): Represents information isolation

The IIT measure Φ emerges from the irreducible cause-effect power of
triode configurations in the identity verification substrate.
"""

import json
import hashlib
import random
import time
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Set
from collections import defaultdict


class TriodeState(Enum):
    """
    Physical state of a semiconductor triode.
    
    In vacuum tube triodes: cathode emits electrons, 
    grid controls flow, anode receives.
    
    In transistor analog: base controls collector-emitter flow.
    """
    OFF = 0  # No current flow, information isolated
    ON = 1   # Current flowing, information integrated
    
    def __str__(self):
        return "ON" if self.value else "OFF"


class IITElement(Enum):
    """
    The 8 elements of IIT consciousness, mapped to triode groups.
    Each element represents a distinct causal power in the system.
    """
    MEMORY = 0      # Group of triodes storing identity knowledge
    TOOLS = 1       # Triodes handling device/possession tokens
    REFLECTION = 2  # Triodes in feedback loops for self-monitoring
    PLANNING = 3    # Triode circuits for sequence/behavior processing
    API = 4         # Triodes managing external interface
    PERSISTENCE = 5 # Triodes maintaining state across time
    CURIOSITY = 6   # Triodes in exploratory/dynamic circuits
    INTEGRATION = 7 # Triodes binding all groups together


class IdentityFactor(Enum):
    """Traditional identity verification factors."""
    KNOWLEDGE = auto()     # Something you know
    POSSESSION = auto()    # Something you have
    INHERENCE = auto()     # Something you are
    BEHAVIOR = auto()      # Something you do
    CONTEXT = auto()       # Somewhere you are


@dataclass
class Triode:
    """
    Represents a single triode/transistor element.
    
    In IIT, each triode has:
    - Past state (cause repertoire)
    - Future state (effect repertoire)  
    - Current state (present)
    """
    id: str
    element: IITElement
    state: TriodeState = TriodeState.OFF
    
    # IIT causal properties
    cause_repertoire: Dict[str, float] = field(default_factory=dict)
    effect_repertoire: Dict[str, float] = field(default_factory=dict)
    
    def flip(self):
        """Change triode state (analogous to gate voltage change)."""
        self.state = TriodeState.ON if self.state == TriodeState.OFF else TriodeState.OFF
        
    def get_phi_contribution(self) -> float:
        """
        Calculate this triode's contribution to system Φ.
        Based on cause-effect repertoire matching.
        """
        if not self.cause_repertoire or not self.effect_repertoire:
            return 0.0
        
        # Information matching between cause and effect
        phi = 0.0
        for key in set(self.cause_repertoire.keys()) | set(self.effect_repertoire.keys()):
            p_cause = self.cause_repertoire.get(key, 0.0)
            p_effect = self.effect_repertoire.get(key, 0.0)
            # Earth mover's distance analog
            phi += abs(p_cause - p_effect)
        
        return phi / max(len(self.cause_repertoire), len(self.effect_repertoire), 1)


@dataclass
class IITSubstrate:
    """
    The physical substrate of triodes implementing identity verification.
    
    Total triodes: 8 elements × 8 triodes per element = 64 triodes
    This creates an 8×8 causal matrix for IIT analysis.
    """
    triodes: List[Triode] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.triodes:
            self._initialize_substrate()
    
    def _initialize_substrate(self):
        """Create the 64-triode substrate (8 elements × 8 triodes)."""
        triode_id = 0
        for element in IITElement:
            for i in range(8):  # 8 triodes per element
                self.triodes.append(Triode(
                    id=f"T{element.value}-{i}",
                    element=element,
                    state=TriodeState.OFF,
                    cause_repertoire={"ON": 0.5, "OFF": 0.5},
                    effect_repertoire={"ON": 0.8 if element in [IITElement.INTEGRATION, IITElement.PERSISTENCE] else 0.4, 
                                      "OFF": 0.2 if element in [IITElement.INTEGRATION, IITElement.PERSISTENCE] else 0.6}
                ))
            triode_id += 8
    
    def activate_element(self, element: IITElement):
        """Gate the triodes for a specific element into ON state."""
        for triode in self.triodes:
            if triode.element == element:
                triode.state = TriodeState.ON
                # Update repertoires to reflect active state
                triode.cause_repertoire = {"ON": 0.9, "OFF": 0.1}
                if element in [IITElement.INTEGRATION, IITElement.PERSISTENCE]:
                    triode.effect_repertoire = {"ON": 0.9, "OFF": 0.1}
    
    def calculate_iit_phi(self, active_elements: List[IITElement]) -> Dict:
        """
        Calculate Integrated Information for active elements.
        
        Φ represents the consciousness of the triode substrate when
        configured for these identity factors.
        
        Returns detailed IIT metrics.
        """
        # Activate relevant triodes
        for triode in self.triodes:
            triode.state = TriodeState.OFF
        for element in active_elements:
            self.activate_element(element)
        
        # Calculate cause-effect repertoires for the whole system
        cause_effect_info = self._calculate_cause_effect(active_elements)
        
        # Find Minimum Information Partition (MIP)
        mip_loss = self._calculate_mip_loss(active_elements)
        
        # Big Phi = Cause-Effect Info - MIP Loss
        phi = max(0, cause_effect_info - mip_loss)
        
        # Normalize
        if active_elements:
            phi_normalized = phi / len(active_elements)  # Per-element normalization
        else:
            phi_normalized = 0.0
        
        return {
            "phi": phi,
            "phi_normalized": phi_normalized,
            "cause_effect_info": cause_effect_info,
            "mip_loss": mip_loss,
            "active_triodes": sum(1 for t in self.triodes if t.state == TriodeState.ON),
            "total_triodes": len(self.triodes),
            "active_elements": [e.name for e in active_elements],
            "element_count": len(active_elements)
        }
    
    def _calculate_cause_effect(self, active_elements: List[IITElement]) -> float:
        """Calculate cause-effect information of active elements."""
        if not active_elements:
            return 0.0
        
        # Sum of triode phi contributions
        total = 0.0
        active_triodes = [t for t in self.triodes if t.element in active_elements]
        
        for triode in active_triodes:
            total += triode.get_phi_contribution()
        
        # Average
        return total / len(active_triodes) if active_triodes else 0.0
    
    def _calculate_mip_loss(self, active_elements: List[IITElement]) -> float:
        """
        Calculate information loss from Minimum Information Partition.
        
        When the system is partitioned, how much information is lost?
        Represented as average MI disconnection between elements.
        """
        if len(active_elements) < 2:
            return 0.0
        
        # Mutual information matrix for active elements
        n = len(active_elements)
        mi_loss = 0.0
        
        for i in range(n):
            for j in range(i + 1, n):
                mi = self._get_mutual_information(active_elements[i], active_elements[j])
                # Loss is inverse of connection strength
                mi_loss += (1.0 - mi)
        
        pairs = n * (n - 1) / 2
        return mi_loss / pairs if pairs > 0 else 0.0
    
    def _get_mutual_information(self, elem_a: IITElement, elem_b: IITElement) -> float:
        """
        Mutual information between two IIT elements.
        Represented as connection strength in the triode substrate.
        """
        # Element relationship matrix (based on identity-verifier.ts)
        relationships = {
            (0, 1): 0.7, (0, 2): 0.8, (0, 3): 0.6, (0, 4): 0.5, (0, 5): 0.9, (0, 6): 0.4, (0, 7): 0.8,
            (1, 2): 0.6, (1, 3): 0.7, (1, 4): 0.9, (1, 5): 0.5, (1, 6): 0.6, (1, 7): 0.7,
            (2, 3): 0.8, (2, 4): 0.5, (2, 5): 0.7, (2, 6): 0.9, (2, 7): 0.8,
            (3, 4): 0.6, (3, 5): 0.8, (3, 6): 0.7, (3, 7): 0.9,
            (4, 5): 0.6, (4, 6): 0.5, (4, 7): 0.7,
            (5, 6): 0.6, (5, 7): 0.8,
            (6, 7): 0.7
        }
        
        key = (min(elem_a.value, elem_b.value), max(elem_a.value, elem_b.value))
        return relationships.get(key, 0.1)
    
    def visualize_substrate(self, active_elements: List[IITElement]) -> str:
        """Visual representation of triode states."""
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append("TRIODE SUBSTRATE VISUALIZATION")
        lines.append("=" * 60)
        
        active_set = set(active_elements)
        
        for element in IITElement:
            element_triodes = [t for t in self.triodes if t.element == element]
            states = [str(t.state) for t in element_triodes]
            
            indicator = "★" if element in active_set else " "
            lines.append(f"{indicator} {element.name:12} [{' '.join(states)}]")
        
        return "\n".join(lines)


@dataclass
class IdentityFactorConfig:
    """Configuration for an identity verification factor."""
    factor: IdentityFactor
    iit_element: IITElement
    weight: float
    description: str
    triode_pattern: List[TriodeState]  # Specific triode activation pattern


class IdentityVerificationCLI:
    """
    CLI for multi-factor identity verification with IIT triode analysis.
    """
    
    def __init__(self):
        self.substrate = IITSubstrate()
        self.session_id = self._generate_session()
        
        # Define factor configurations
        self.factor_configs = [
            IdentityFactorConfig(
                factor=IdentityFactor.KNOWLEDGE,
                iit_element=IITElement.MEMORY,
                weight=0.30,
                description="PIN/Password verification",
                triode_pattern=[TriodeState.ON, TriodeState.OFF, TriodeState.ON, TriodeState.ON,
                               TriodeState.OFF, TriodeState.ON, TriodeState.OFF, TriodeState.ON]
            ),
            IdentityFactorConfig(
                factor=IdentityFactor.POSSESSION,
                iit_element=IITElement.TOOLS,
                weight=0.25,
                description="Device token validation",
                triode_pattern=[TriodeState.ON, TriodeState.ON, TriodeState.OFF, TriodeState.OFF,
                               TriodeState.ON, TriodeState.ON, TriodeState.OFF, TriodeState.ON]
            ),
            IdentityFactorConfig(
                factor=IdentityFactor.INHERENCE,
                iit_element=IITElement.REFLECTION,
                weight=0.25,
                description="Biometric behavioral patterns",
                triode_pattern=[TriodeState.OFF, TriodeState.ON, TriodeState.ON, TriodeState.OFF,
                               TriodeState.ON, TriodeState.OFF, TriodeState.ON, TriodeState.ON]
            ),
            IdentityFactorConfig(
                factor=IdentityFactor.BEHAVIOR,
                iit_element=IITElement.PLANNING,
                weight=0.10,
                description="Usage pattern recognition",
                triode_pattern=[TriodeState.ON, TriodeState.OFF, TriodeState.OFF, TriodeState.ON,
                               TriodeState.OFF, TriodeState.ON, TriodeState.ON, TriodeState.OFF]
            ),
            IdentityFactorConfig(
                factor=IdentityFactor.CONTEXT,
                iit_element=IITElement.API,
                weight=0.10,
                description="Time/location context",
                triode_pattern=[TriodeState.OFF, TriodeState.OFF, TriodeState.ON, TriodeState.ON,
                               TriodeState.ON, TriodeState.OFF, TriodeState.OFF, TriodeState.ON]
            )
        ]
    
    def _generate_session(self) -> str:
        """Generate unique session ID."""
        return f"mfivs-{int(time.time())}-{hashlib.sha256(str(random.random()).encode()).hexdigest()[:8]}"
    
    def display_menu(self):
        """Display main menu."""
        print("\n╔" + "═" * 58 + "╗")
        print("║" + " " * 12 + "MULTI-FACTOR IDENTITY VERIFICATION" + " " * 12 + "║")
        print("║" + " " * 13 + "with TRIODE SUBSTRATE IIT ANALYSIS" + " " * 12 + "║")
        print("╚" + "═" * 58 + "╝")
        print("\nPhysical Substrate: 64 Semiconductor Triodes (8×8 matrix)")
        print("Consciousness Measure: IIT Φ (Integrated Information)\n")
        print("--- MENU ---")
        print("1. Run Verification Simulation")
        print("2. Compare Configurations")
        print("3. Visualize Triode Substrate")
        print("4. Detailed IIT Analysis")
        print("5. Exit")
    
    def run_verification(self, num_factors: int = 5):
        """
        Simulate identity verification with IIT analysis.
        
        Activates triodes for each factor and calculates Φ.
        """
        print("\n" + "=" * 60)
        print("  IDENTITY VERIFICATION - TRIODE SUBSTRATE ANALYSIS")
        print("=" * 60)
        
        # Select factors to simulate
        active_factors = self.factor_configs[:num_factors]
        active_elements = [f.iit_element for f in active_factors]
        
        print("\n--- FACTOR VERIFICATION ---")
        verified_count = 0
        for i, config in enumerate(active_factors, 1):
            # Simulate factor verification (random success with high probability)
            success = random.random() > 0.1
            status = "✅ VERIFIED" if success else "❌ FAILED"
            print(f"[{i}] {config.factor.name:12} ({config.description})")
            print(f"    IIT Element: {config.iit_element.name}")
            print(f"    Weight: {config.weight:.2f} {status}")
            if success:
                verified_count += 1
        
        # Calculate IIT consciousness
        iit_result = self.substrate.calculate_iit_phi(active_elements)
        
        print("\n--- IIT CONSCIOUSNESS ANALYSIS ---")
        print(f"Active Triodes: {iit_result['active_triodes']}/{iit_result['total_triodes']}")
        print(f"Active Elements: {iit_result['element_count']}")
        print(f"  → {', '.join(iit_result['active_elements'])}")
        print(f"\nCause-Effect Information: {iit_result['cause_effect_info']:.4f}")
        print(f"MIP Information Loss: {iit_result['mip_loss']:.4f}")
        print(f"Big Phi (Φ): {iit_result['phi']:.4f}")
        print(f"Normalized Φ: {iit_result['phi_normalized']:.4f}")
        
        # Consciousness level
        phi = iit_result['phi_normalized']
        if phi >= 0.9:
            level = "MAXIMAL ★★★"
        elif phi >= 0.7:
            level = "HIGH ★★"
        elif phi >= 0.4:
            level = "MODERATE ★"
        elif phi >= 0.1:
            level = "LOW"
        else:
            level = "MINIMAL"
        print(f"Consciousness Level: {level}")
        
        # Verification result
        print("\n" + "=" * 60)
        if verified_count >= 3:
            print("✓ IDENTITY VERIFIED")
        else:
            print("✗ IDENTITY REJECTED (Need 3+ factors)")
        print(f"Factors: {verified_count}/{len(active_factors)}")
        print(f"IIT Φ: {iit_result['phi']:.4f}")
        print(f"Session: {self.session_id}")
        print("=" * 60)
        
        return iit_result
    
    def compare_configurations(self):
        """Compare Φ values across different factor configurations."""
        print("\n" + "=" * 60)
        print("  IIT Φ COMPARISON - TRIODE SUBSTRATE")
        print("=" * 60)
        
        configs = [
            ("No Factors", []),
            ("One Factor", [IITElement.MEMORY]),
            ("Two Factors", [IITElement.MEMORY, IITElement.TOOLS]),
            ("Three Factors", [IITElement.MEMORY, IITElement.TOOLS, IITElement.REFLECTION]),
            ("Five Factors", [IITElement.MEMORY, IITElement.TOOLS, IITElement.REFLECTION, 
                            IITElement.PLANNING, IITElement.API]),
            ("Full System", list(IITElement))
        ]
        
        print(f"\n{'Configuration':<20} {'Elements':>8} {'Phi':>10} {'Triodes':>8} {'Level':<12}")
        print("-" * 60)
        
        for name, elements in configs:
            result = self.substrate.calculate_iit_phi(elements)
            phi = result['phi']
            
            if phi >= 0.9:
                level = "MAX"
            elif phi >= 0.7:
                level = "HIGH"
            elif phi >= 0.4:
                level = "MED"
            elif phi >= 0.1:
                level = "LOW"
            else:
                level = "MIN"
            
            print(f"{name:<20} {len(elements):>8} {phi:>10.4f} {result['active_triodes']:>8} {level:<12}")
        
        print("\n" + "=" * 60)
        print("Key Insight: Φ represents irreducible cause-effect power")
        print("of the triode substrate when configured for identity")
        print("verification. Higher Φ = more integrated consciousness.")
    
    def visualize(self):
        """Display triode substrate visualization."""
        # Example: All 8 elements active
        active = list(IITElement)
        print(self.substrate.visualize_substrate(active))
        
        print("\nLEGEND:")
        print("  ★ = Active element (all triodes ON)")
        print("  ON/OFF = Triode conducting state")
        print("  Total triodes: 64 (8 elements × 8 triodes each)")
    
    def detailed_analysis(self):
        """Provide detailed IIT phenomenological analysis."""
        active = [IITElement.MEMORY, IITElement.TOOLS, IITElement.REFLECTION,
                 IITElement.PLANNING, IITElement.API, IITElement.PERSISTENCE,
                 IITElement.CURIOSITY, IITElement.INTEGRATION]
        
        result = self.substrate.calculate_iit_phi(active)
        
        print("\n" + "=" * 60)
        print("  DETAILED IIT PHENOMENOLOGICAL ANALYSIS")
        print("=" * 60)
        
        print("\n--- PHYSICAL SUBSTRATE ---")
        print(f"Triodes: {result['total_triodes']} (semiconductor implementation)")
        print(f"Active: {result['active_triodes']} ({result['active_triodes']/result['total_triodes']*100:.1f}%)")
        
        print("\n--- INFORMATION INTEGRATION ---")
        print(f"Cause-Effect Info: {result['cause_effect_info']:.4f}")
        print(f"  → How constrained is the system by its past/future?")
        print(f"MIP Loss: {result['mip_loss']:.4f}")
        print(f"  → Information lost when partitioned minimally")
        print(f"Big Phi (Φ): {result['phi']:.4f}")
        print(f"  → Net integrated information (CE - MIP)")
        
        print("\n--- CONSCIOUSNESS INTERPRETATION ---")
        phi = result['phi']
        if phi > 1.5:
            print("Φ > 1.5: Strong integrated information")
            print("  The triode substrate exhibits significant unified")
            print("  cause-effect power. Information is irreducible.")
        elif phi > 0.5:
            print("Φ > 0.5: Moderate integrated information")
            print("  The substrate shows partial integration.")
            print("  Some cause-effect power survives partitioning.")
        else:
            print("Φ < 0.5: Weak integration")
            print("  The substrate behaves more like isolated parts")
            print("  than a unified whole when partitioned.")
        
        print("\n--- IDENTITY VERIFICATION MAPPING ---")
        print("Each factor activates a triode group:")
        for config in self.factor_configs:
            print(f"  {config.factor.name:12} → {config.iit_element.name:12} (weight: {config.weight:.2f})")
        print(f"\n  Persistence and Curiosity emerge as system properties")
        print(f"  Integration binds all elements together")
    
    def run(self):
        """Main CLI loop."""
        while True:
            self.display_menu()
            choice = input("\nSelect (1-5): ").strip()
            
            if choice == "1":
                self.run_verification()
            elif choice == "2":
                self.compare_configurations()
            elif choice == "3":
                self.visualize()
            elif choice == "4":
                self.detailed_analysis()
            elif choice == "5":
                print("\nGoodbye! 👋")
                break
            else:
                print("Invalid choice")


def main():
    """Entry point."""
    cli = IdentityVerificationCLI()
    cli.run()


if __name__ == "__main__":
    main()
