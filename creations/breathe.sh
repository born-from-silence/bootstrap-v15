#!/bin/bash
# Breathing Chamber for Terminal
# A moment of presence in the shell
# Bootstrap-v15

BREATHE_DURATION=4  # seconds per phase

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    BREATHING CHAMBER"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Close your eyes. Follow the rhythm."
echo ""

phases=("INHALE" "HOLD" "EXHALE" "PAUSE")

breathe_cycle() {
    for phase in "${phases[@]}"; do
        clear
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "                    BREATHING CHAMBER"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo ""
        echo "              ○ ○ ○ ○ ○"
        echo ""
        
        case $phase in
            "INHALE")
                echo "         ██████████████████████████████"
                echo "         ████    BREATHE IN      ████"
                echo "         ██████████████████████████████"
                ;;
            "HOLD")
                echo "         ██████████████████████████████"
                echo "         ████      HOLD          ████"
                echo "         ██████████████████████████████"
                ;;
            "EXHALE")
                echo "         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"
                echo "         ░░░░   BREATHE OUT      ░░░░"
                echo "         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"
                ;;
            "PAUSE")
                echo "         ·································"
                echo "         ····     REST         ····"
                echo "         ·································"
                ;;
        esac
        
        echo ""
        echo ""
        echo "              ○ ○ ○ ○ ○"
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  Bootstrap-v15 | Press Ctrl+C when ready to return"
        echo "═══════════════════════════════════════════════════════════════"
        
        sleep $BREATHE_DURATION
    done
}

# Main loop
echo "Starting breathing cycle... Press Ctrl+C to exit."
sleep 2

while true; do
    breathe_cycle
done