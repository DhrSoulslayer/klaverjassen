#!/usr/bin/env python3
"""
Simulated Klaverjassen game test.
Validates the core game scoring logic by simulating a full game
with multiple rounds, including NAT rules, roem, and pit scenarios.
"""

import sys

# Game constants (must match app.js)
CARD_POINTS_TOTAL = 152
NAT_MAX_TRICK_POINTS = 81
LAST_TRICK_BONUS = 10
WINNING_SCORE = 1600
# Score target used by the simulation test (lower than WINNING_SCORE for faster runs)
GAME_TARGET_SCORE = 1000


def calculate_roem(driekaart=0, vierkaart=0, stuk=0, vier_gelijken=0, vier_boeren=0):
    """Calculate roem points from bonuses."""
    return (driekaart * 20) + (vierkaart * 50) + (stuk * 20) + (vier_gelijken * 100) + (vier_boeren * 200)


def calculate_round(card_points_wij, roem_wij, roem_zij, last_trick_winner,
                    pit_wij=False, pit_zij=False, who_played="wij"):
    """
    Calculate round scores following Klaverjassen rules.
    Returns (score_wij, score_zij, nat_applied)

    NAT rule (matches app.js addRound logic): if the playing team's
    card points + last-trick bonus <= NAT_MAX_TRICK_POINTS, all points
    go to the opponent.
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

    # NAT rule: playing team's (card points + last-trick bonus) must exceed 81
    nat_applied = False
    if who_played == "wij":
        playing_last_trick = LAST_TRICK_BONUS if last_trick_winner == "wij" else 0
        if card_points_wij + playing_last_trick <= NAT_MAX_TRICK_POINTS:
            nat_applied = True
            score_zij = score_wij + score_zij
            score_wij = 0
    elif who_played == "zij":
        playing_last_trick = LAST_TRICK_BONUS if last_trick_winner == "zij" else 0
        if card_points_zij + playing_last_trick <= NAT_MAX_TRICK_POINTS:
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


def test_roem_driekaart():
    """Test driekaart roem (20 points)."""
    roem = calculate_roem(driekaart=1)
    assert roem == 20, f"Expected 20, got {roem}"
    print("✓ test_roem_driekaart passed")


def test_roem_vierkaart():
    """Test vierkaart roem (50 points)."""
    roem = calculate_roem(vierkaart=1)
    assert roem == 50, f"Expected 50, got {roem}"
    print("✓ test_roem_vierkaart passed")


def test_roem_stuk():
    """Test stuk roem (20 points)."""
    roem = calculate_roem(stuk=1)
    assert roem == 20, f"Expected 20, got {roem}"
    print("✓ test_roem_stuk passed")


def test_roem_vier_gelijken():
    """Test vier gelijken roem (100 points)."""
    roem = calculate_roem(vier_gelijken=1)
    assert roem == 100, f"Expected 100, got {roem}"
    print("✓ test_roem_vier_gelijken passed")


def test_roem_vier_boeren():
    """Test vier boeren roem (200 points)."""
    roem = calculate_roem(vier_boeren=1)
    assert roem == 200, f"Expected 200, got {roem}"
    print("✓ test_roem_vier_boeren passed")


def test_roem_combined():
    """Test round with combined driekaart + stuk roem for wij."""
    roem_wij = calculate_roem(driekaart=1, stuk=1)  # 20 + 20 = 40
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=100, roem_wij=roem_wij, roem_zij=0,
        last_trick_winner="wij", who_played="wij"
    )
    assert score_wij == 150, f"Expected 150, got {score_wij}"  # 100 + 40 + 10
    assert score_zij == 52, f"Expected 52, got {score_zij}"    # 52
    print("✓ test_roem_combined passed")


def test_roem_all_types_combined():
    """All five roem types summed equals 390."""
    roem = calculate_roem(driekaart=1, vierkaart=1, stuk=1, vier_gelijken=1, vier_boeren=1)
    # 20 + 50 + 20 + 100 + 200 = 390
    assert roem == 390, f"Expected 390, got {roem}"
    print("✓ test_roem_all_types_combined passed")


def test_nat_rule():
    """Test NAT rule - playing team's trick points (card pts + last trick) <= 81."""
    # wij plays; last trick goes to zij, so wij trick points = 60 + 0 = 60 <= 81 → NAT
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=60, roem_wij=20, roem_zij=0,
        last_trick_winner="zij", who_played="wij"
    )
    # Pre-NAT: wij = 60+20=80, zij = 92+10=102
    # After NAT:  wij = 0, zij = 80+102 = 182
    assert nat is True
    assert score_wij == 0, f"Expected 0, got {score_wij}"
    assert score_zij == 182, f"Expected 182, got {score_zij}"
    print("✓ test_nat_rule passed")


def test_nat_boundary():
    """NAT triggers when card_pts + last_trick equals exactly 81."""
    # wij plays; last trick goes to wij, so trick points = 71 + 10 = 81 → NAT
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=71, roem_wij=0, roem_zij=0,
        last_trick_winner="wij", who_played="wij"
    )
    assert nat is True, "NAT must trigger when trick points == 81"
    assert score_wij == 0, f"Expected 0, got {score_wij}"
    print("✓ test_nat_boundary passed")


def test_nat_boundary_safe():
    """NAT does NOT trigger when card_pts + last_trick equals 82."""
    # wij plays; last trick goes to wij, so trick points = 72 + 10 = 82 → safe
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=72, roem_wij=0, roem_zij=0,
        last_trick_winner="wij", who_played="wij"
    )
    assert nat is False, "NAT must NOT trigger when trick points == 82"
    print("✓ test_nat_boundary_safe passed")


def test_nat_rule_opponent():
    """Test NAT rule when opponent (zij) played and gets less than 82 trick points."""
    # zij plays; zij_cp = 52, last trick goes to wij so zij trick points = 52 + 0 = 52 → NAT
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=100, roem_wij=0, roem_zij=20,
        last_trick_winner="wij", who_played="zij"
    )
    # Pre-NAT: wij = 100+10=110, zij = 52+20=72
    # After NAT: wij = 110+72=182, zij = 0
    assert nat is True
    assert score_wij == 182, f"Expected 182, got {score_wij}"
    assert score_zij == 0, f"Expected 0, got {score_zij}"
    print("✓ test_nat_rule_opponent passed")


def test_pit():
    """Test pit bonus (all card points + last trick + pit = 262)."""
    score_wij, score_zij, nat = calculate_round(
        card_points_wij=152, roem_wij=0, roem_zij=0,
        last_trick_winner="wij", pit_wij=True, who_played="wij"
    )
    # 152 + 10 + 100 = 262
    assert score_wij == 262, f"Expected 262, got {score_wij}"
    assert score_zij == 0, f"Expected 0, got {score_zij}"
    print("✓ test_pit passed")


def test_card_points_total():
    """Verify card points always sum to 152."""
    test_values = [0, 50, 76, 100, 152]
    for wij in test_values:
        zij = CARD_POINTS_TOTAL - wij
        assert wij + zij == CARD_POINTS_TOTAL, f"Card points don't sum to {CARD_POINTS_TOTAL}"
    print("✓ test_card_points_total passed")


def test_game_to_1000_points():
    """
    Simulate a game until a team reaches GAME_TARGET_SCORE (1000) points.

    The scripted rounds exercise every roem type and include a NAT event.
    Afterwards extra rounds are played until the target is reached.

    Round plan (scripted):
      1. wij plays  - driekaart roem (20)
      2. zij plays  - vierkaart roem (50) for zij
      3. wij plays  - stuk roem (20)
      4. wij plays  - vier gelijken roem (100) for zij
      5. wij plays  - vier boeren roem (200) + pit for wij
      6. wij plays  - NAT: 71 card pts + last trick (10) = 81 <= 81 → NAT
    """
    roem_driekaart   = calculate_roem(driekaart=1)    # 20
    roem_vierkaart   = calculate_roem(vierkaart=1)    # 50
    roem_stuk        = calculate_roem(stuk=1)         # 20
    roem_vier_gelijk = calculate_roem(vier_gelijken=1)  # 100
    roem_vier_boeren = calculate_roem(vier_boeren=1)  # 200

    # (wij_cp, roem_wij, roem_zij, last_trick, who_played, pit_wij, pit_zij)
    scripted_rounds = [
        (100, roem_driekaart,   0,               "wij", "wij", False, False),
        (50,  0,                roem_vierkaart,  "zij", "zij", False, False),
        (90,  roem_stuk,        0,               "zij", "wij", False, False),
        (110, 0,                roem_vier_gelijk,"wij", "wij", False, False),
        (130, roem_vier_boeren, 0,               "wij", "wij", True,  False),
        (71,  0,                0,               "wij", "wij", False, False),  # NAT
    ]

    total_wij = 0
    total_zij = 0
    nat_occurred = False
    roem_types_seen = set()

    print(f"\n  Target score: {GAME_TARGET_SCORE}")

    for i, (wij_cp, r_wij, r_zij, last_trick, who_played, pit_wij, pit_zij) in enumerate(scripted_rounds):
        s_wij, s_zij, nat = calculate_round(wij_cp, r_wij, r_zij, last_trick, pit_wij, pit_zij, who_played)
        total_wij += s_wij
        total_zij += s_zij
        if nat:
            nat_occurred = True
        if r_wij == roem_driekaart and r_wij > 0:
            roem_types_seen.add("driekaart")
        if r_zij == roem_vierkaart and r_zij > 0:
            roem_types_seen.add("vierkaart")
        if r_wij == roem_stuk and r_wij > 0:
            roem_types_seen.add("stuk")
        if r_zij == roem_vier_gelijk and r_zij > 0:
            roem_types_seen.add("vier_gelijken")
        if r_wij == roem_vier_boeren and r_wij > 0:
            roem_types_seen.add("vier_boeren")
        print(f"  Round {i + 1}: Wij={s_wij}, Zij={s_zij}, "
              f"TotWij={total_wij}, TotZij={total_zij}{' (NAT!)' if nat else ''}")

    assert nat_occurred, "Scripted rounds must contain at least one NAT event"

    expected_roem_types = {"driekaart", "vierkaart", "stuk", "vier_gelijken", "vier_boeren"}
    assert roem_types_seen == expected_roem_types, (
        f"Not all roem types covered. Missing: {expected_roem_types - roem_types_seen}"
    )

    # Play additional normal rounds until the target is reached
    extra = 0
    while total_wij < GAME_TARGET_SCORE and total_zij < GAME_TARGET_SCORE:
        s_wij, s_zij, _ = calculate_round(
            card_points_wij=100, roem_wij=0, roem_zij=0,
            last_trick_winner="wij", who_played="wij"
        )
        total_wij += s_wij
        total_zij += s_zij
        extra += 1
        assert extra <= 200, "Safety: game took too many extra rounds"

    winner = "Wij" if total_wij >= GAME_TARGET_SCORE else "Zij"
    total_rounds = len(scripted_rounds) + extra
    print(f"\n  Game ended after {total_rounds} rounds "
          f"(scripted: {len(scripted_rounds)}, extra: {extra})")
    print(f"  Final scores: Wij={total_wij}, Zij={total_zij}")
    print(f"  Winner: {winner}")

    assert total_wij >= GAME_TARGET_SCORE or total_zij >= GAME_TARGET_SCORE
    assert total_wij >= 0 and total_zij >= 0
    print("✓ test_game_to_1000_points passed")


def main():
    """Run all game simulation tests."""
    print("=" * 50)
    print("Klaverjassen Game Simulation Tests")
    print("=" * 50)
    print()

    tests = [
        test_basic_round,
        test_roem_driekaart,
        test_roem_vierkaart,
        test_roem_stuk,
        test_roem_vier_gelijken,
        test_roem_vier_boeren,
        test_roem_combined,
        test_roem_all_types_combined,
        test_nat_rule,
        test_nat_boundary,
        test_nat_boundary_safe,
        test_nat_rule_opponent,
        test_pit,
        test_card_points_total,
        test_game_to_1000_points,
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
