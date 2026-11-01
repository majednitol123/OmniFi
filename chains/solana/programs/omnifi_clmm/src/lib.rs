#![allow(clippy::manual_div_ceil)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod math;
pub mod state;

pub use instructions::*;

declare_id!("BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2");

#[program]
pub mod omnifi_clmm {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        default_protocol_fee_fraction: u32,
    ) -> Result<()> {
        process_initialize_config(ctx, default_protocol_fee_fraction)
    }

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_tier: u32,
        tick_spacing: u16,
        init_sqrt_price_x64: u128,
    ) -> Result<()> {
        process_initialize_pool(ctx, fee_tier, tick_spacing, init_sqrt_price_x64)
    }

    pub fn initialize_tick_array(
        ctx: Context<InitializeTickArray>,
        start_tick_index: i32,
    ) -> Result<()> {
        process_initialize_tick_array(ctx, start_tick_index)
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        tick_lower_index: i32,
        tick_upper_index: i32,
    ) -> Result<()> {
        process_open_position(ctx, tick_lower_index, tick_upper_index)
    }

    pub fn increase_liquidity(
        ctx: Context<ModifyLiquidity>,
        liquidity_delta: u128,
        amount_0_max: u64,
        amount_1_max: u64,
    ) -> Result<()> {
        process_increase_liquidity(ctx, liquidity_delta, amount_0_max, amount_1_max)
    }

    pub fn decrease_liquidity(
        ctx: Context<ModifyLiquidity>,
        liquidity_delta: u128,
        amount_0_min: u64,
        amount_1_min: u64,
    ) -> Result<()> {
        process_decrease_liquidity(ctx, liquidity_delta, amount_0_min, amount_1_min)
    }

    pub fn collect_fees(ctx: Context<CollectFees>) -> Result<()> {
        process_collect_fees(ctx)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        process_close_position(ctx)
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount: u64,
        other_amount_threshold: u64,
        sqrt_price_limit_x64: u128,
        is_exact_input: bool,
        zero_for_one: bool,
    ) -> Result<()> {
        process_swap(
            ctx,
            amount,
            other_amount_threshold,
            sqrt_price_limit_x64,
            is_exact_input,
            zero_for_one,
        )
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_protocol_fee_fraction: Option<u32>,
    ) -> Result<()> {
        process_update_config(ctx, new_protocol_fee_fraction)
    }

    pub fn set_emergency_paused(
        ctx: Context<SetEmergencyPaused>,
        emergency_paused: bool,
    ) -> Result<()> {
        process_set_emergency_paused(ctx, emergency_paused)
    }

    pub fn pause_pool(ctx: Context<PausePool>, is_paused: bool) -> Result<()> {
        process_pause_pool(ctx, is_paused)
    }

    pub fn collect_protocol_fees(ctx: Context<CollectProtocolFees>) -> Result<()> {
        process_collect_protocol_fees(ctx)
    }
}

#[cfg(test)]
mod tests {
    use crate::constants::{MAX_SQRT_PRICE, MIN_SQRT_PRICE};
    use crate::math::sqrt_price_math::{get_amount_0_delta, get_amount_1_delta};
    use crate::math::swap_math::compute_swap_step;
    use crate::math::tick_math::{get_sqrt_price_at_tick, get_tick_at_sqrt_price};

    #[test]
    fn test_tick_at_sqrt_price_roundtrip() {
        let test_ticks = [-400000, -10000, -60, 0, 60, 10000, 400000];
        for tick in test_ticks {
            let sqrt_p = get_sqrt_price_at_tick(tick).unwrap();
            let recovered_tick = get_tick_at_sqrt_price(sqrt_p).unwrap();
            assert_eq!(recovered_tick, tick, "Failed roundtrip for tick {}", tick);
        }
    }

    #[test]
    fn test_clmm_amount_deltas_symmetry() {
        let p_lower = get_sqrt_price_at_tick(-1000).unwrap();
        let p_upper = get_sqrt_price_at_tick(1000).unwrap();
        let liquidity = 1_000_000_000u128;

        let delta_0 = get_amount_0_delta(p_lower, p_upper, liquidity, false).unwrap();
        let delta_1 = get_amount_1_delta(p_lower, p_upper, liquidity, false).unwrap();

        assert!(delta_0 > 0);
        assert!(delta_1 > 0);
    }

    #[test]
    fn test_clmm_swap_step_exact_input() {
        let current_p = get_sqrt_price_at_tick(0).unwrap();
        let target_p = get_sqrt_price_at_tick(-100).unwrap();
        let liquidity = 10_000_000_000u128;
        let amount_in = 1_000_000u64;

        let step = compute_swap_step(
            current_p,
            target_p,
            liquidity,
            amount_in,
            3000, // 0.30%
            true, // exact input
            true, // zero for one (price drops)
        )
        .unwrap();

        assert!(step.amount_in > 0);
        assert!(step.amount_out > 0);
        assert!(step.fee_amount > 0);
        assert!(step.sqrt_price_next_x64 <= current_p);
        assert!(step.sqrt_price_next_x64 >= target_p);
    }

    #[test]
    fn test_clmm_swap_step_exact_output() {
        let current_p = get_sqrt_price_at_tick(0).unwrap();
        let target_p = get_sqrt_price_at_tick(100).unwrap();
        let liquidity = 10_000_000_000u128;
        let amount_out = 500_000u64;

        let step = compute_swap_step(
            current_p,
            target_p,
            liquidity,
            amount_out,
            3000,
            false, // exact output
            false, // one for zero (price rises)
        )
        .unwrap();

        assert!(step.amount_in > 0);
        assert!(step.amount_out > 0);
        assert!(step.fee_amount > 0);
        assert!(step.sqrt_price_next_x64 >= current_p);
        assert!(step.sqrt_price_next_x64 <= target_p);
    }

    #[test]
    fn test_price_bounds_verification() {
        assert!(MIN_SQRT_PRICE > 0);
        assert!(MAX_SQRT_PRICE > MIN_SQRT_PRICE);
    }
}
