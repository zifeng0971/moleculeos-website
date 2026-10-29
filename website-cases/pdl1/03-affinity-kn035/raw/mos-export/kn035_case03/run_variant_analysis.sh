#!/bin/bash
# usage: ./run_variant_analysis.sh <variant_cif> <pos> <wt> <mut> <label>
set -e
CIF=$1; POS=$2; WT=$3; MUT=$4; LAB=$5
SD=/app/src/mocha/agents/custom_skills/interaction-analysis/scripts
mkdir -p raw/variants/$LAB
python3 compare_variant.py "$CIF" "$POS" "$WT" "$MUT" "$LAB"
python3 $SD/calc_interface.py "$CIF" --chain-pairs A:B -o raw/variants/$LAB/interface 2>&1 | tail -2
python3 $SD/calc_contacts.py "$CIF" -o raw/variants/$LAB/contacts --inter-chain-only 2>&1 | tail -2
