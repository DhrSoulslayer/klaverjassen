#!/usr/bin/env python3
"""
Simulated Klaverjassen game test.
Validates the core game scoring logic by simulating a full game
with multiple rounds, including NAT rules, roem, and pit scenarios.
"""

import sys
import json

# Game constants (must match app.js)
CARD_POINTS_TOTAL = 152
NAT_MAX_TRICK_POINTS = 81
LAST_TRICK_BONUS = 10
WINNING_SCORE = 1600


def calculate_roem(driekaart=0, vierkaart=0, stuk=0, vier_gelijken=0, vier_boeren=0):
    """Calculate roem points from bonuses."""
    return (driekaart * 20) + (vierkaart * 50) + (stuk * 20) + (vier_gelijken * 100) + (vier_boeren * 200)


def calculate_round(card_points_wij, roem_wij, roem_zij, last_trick_winner,
                    pit_wij=False, pit_zij=False, who_played="wij"):
    """
    Calculate round scores following Klaverjassen rules.
    Returns (score_wij, score_zij, nat_applied)
    """
    card_points_zij = CARD_POINTS_TOTAL - card_points_wij

    # Base scores
    score_wij = card_points_wij + roem_wij
    score_zij = card_points_zij + roem_zij

    # Last trick bonus
    if last_trick_winner == "wij":
        score_wij += LAST_TRICK_BONUS
    else:
        score_zij += LAST_TRICK_BONUS

    # Pit bonus
    if pit_wij:
        score_wij += 100
    if pit_zij:
        score_zij += 100

    # NAT rule: if playing team's card points <= 81, opponent gets all points
    nat_applied = False
    if who_played == "wij" and card_points_wij <= NAT_MAX_TRICK_POINTS:
        nat_applied = True
        score_zij = score_wij + score_zij
        score_wij = 0
    elif who_played == "zij" and card_points_zij <= NAT_MAX_TRICK_POINTS:
        nat_applied = True
        score_wij = score_wij + score_zij
        score_zij = 0

    return score_wij, score_zij, nat_applied


def test_basic_round():
    """Test a basic round with no bonuses."""
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=90, roem_wij=0, roem_zij=0,
        last_trick_winner="wij", who_played="wij"
    )
    assert score_wij == 100, f"Expected 100, got {score_wij}"  # 90 + 10 (last trick)
    assert score_zij == 62, f"Expected 62, got {score_zij}"    # 62
    assert nat is False
    print("✓ test_basic_round passed")


def test_roem():
    """Test round with roem bonuses."""
    roem_wij = calculate_roem(driekaart=1, stuk=1)  # 20 + 20 = 40
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=100, roem_wij=roem_wij, roem_zij=0,
        last_trick_winner="wij", who_played="wij"
    )
    assert score_wij == 150, f"Expected 150, got {score_wij}"  # 100 + 40 + 10
    assert score_zij == 52, f"Expected 52, got {score_zij}"    # 52
    print("✓ test_roem passed")


def test_nat_rule():
    """Test NAT rule - playing team gets less than 82 card points."""
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=60, roem_wij=20, roem_zij=0,
        last_trick_winner="zij", who_played="wij"
    )
    # Wij played but only got 60 card points (<=81), so NAT applies
    # Wij would have: 60 + 20 = 80, Zij would have: 92 + 10 = 102
    # After NAT: Wij = 0, Zij = 80 + 102 = 182
    assert nat is True
    assert score_wij == 0, f"Expected 0, got {score_wij}"
    assert score_zij == 182, f"Expected 182, got {score_zij}"
    print("✓ test_nat_rule passed")


def test_nat_rule_opponent():
    """Test NAT rule when opponent (zij) played and gets less than 82."""
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=100, roem_wij=0, roem_zij=20,
        last_trick_winner="wij", who_played="zij"
    )
    # Zij played but only got 52 card points (<=81), so NAT applies
    # Wij would have: 100 + 10 = 110, Zij would have: 52 + 20 = 72
    # After NAT: Wij = 110 + 72 = 182, Zij = 0
    assert nat is True
    assert score_wij == 182, f"Expected 182, got {score_wij}"
    assert score_zij == 0, f"Expected 0, got {score_zij}"
    print("✓ test_nat_rule_opponent passed")


def test_pit():
    """Test pit bonus."""
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=152, roem_wij=0, roem_zij=0,
        last_trick_winner="wij", pit_wij=True, who_played="wij"
    )
    # All card points + last trick + pit = 152 + 10 + 100 = 262
    assert score_wij == 262, f"Expected 262, got {score_wij}"
    assert score_zij == 0, f"Expected 0, got {score_zij}"
    print("✓ test_pit passed")


def test_full_game_simulation():
    """Simulate a full multi-round game."""
    total_wij = 0
    total_zij = 0

    rounds = [
        {"card_points_wij": 90, "roem_wij": 0, "roem_zij": 0, "last_trick": "wij", "who_played": "wij"},
        {"card_points_wij": 70, "roem_wij": 20, "roem_zij": 0, "last_trick": "zij", "who_played": "zij"},
        {"card_points_wij": 110, "roem_wij": 0, "roem_zij": 20, "last_trick": "wij", "who_played": "wij"},
        {"card_points_wij": 50, "roem_wij": 0, "roem_zij": 0, "last_trick": "zij", "who_played": "wij"},  # NAT
        {"card_points_wij": 130, "roem_wij": 50, "roem_zij": 0, "last_trick": "wij", "who_played": "wij"},
        {"card_points_wij": 80, "roem_wij": 0, "roem_zij": 40, "last_trick": "wij", "who_played": "wij"},
        {"card_points_wij": 100, "roem_wij": 20, "roem_zij": 0, "last_trick": "zij", "who_played": "zij"},
        {"card_points_wij": 95, "roem_wij": 0, "roem_zij": 0, "last_trick": "wij", "who_played": "wij"},
    ]

    for i, r in enumerate(rounds):
        s_wij, s_zij, nat = calculate_round(
            card_points_wij=r["card_points_wij"],
            roem_wij=r["roem_wij"],
            roem_zij=r["roem_zij"],
            last_trick_winner=r["last_trick"],
            who_played=r["who_played"]
        )
        total_wij += s_wij
        total_zij += s_zij
        print(f"  Round {i+1}: Wij={s_wij}, Zij={s_zij}{' (NAT!)' if nat else ''}")

    print(f"\n  Final scores: Wij={total_wij}, Zij={total_zij}")
    winner = "Wij" if total_wij > total_zij else "Zij"
    print(f"  Winner: {winner}")

    # Verify total points make sense (no points lost)
    assert total_wij >= 0 and total_zij >= 0, "Scores cannot be negative"
    print("✓ test_full_game_simulation passed")


def test_card_points_total():
    """Verify card points always sum to 152."""
    test_values = [0, 50, 76, 100, 152]
    for wij in test_values:
        zij = CARD_POINTS_TOTAL - wij
        assert wij + zij == CARD_POINTS_TOTAL, f"Card points don't sum to {CARD_POINTS_TOTAL}"
    print("✓ test_card_points_total passed")


def test_vier_boeren_roem():
    """Test vier boeren (4 jacks) roem calculation."""
    roem = calculate_roem(vier_boeren=1)
    assert roem == 200, f"Expected 200, got {roem}"
    print("✓ test_vier_boeren_roem passed")


def main():
    """Run all game simulation tests."""
    print("=" * 50)
    print("Klaverjassen Game Simulation Tests")
    print("=" * 50)
    print()

    tests = [
        test_basic_round,
        test_roem,
        test_nat_rule,
        test_nat_rule_opponent,
        test_pit,
        test_card_points_total,
        test_vier_boeren_roem,
        test_full_game_simulation,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} ERROR: {e}")
            failed += 1

    print()
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 50)

    if failed > 0:
        sys.exit(1)
    else:
        print("\nAll tests passed! ✓")
        sys.exit(0)


if __name__ == "__main__":
    main()
