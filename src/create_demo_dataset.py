import pandas as pd
import numpy as np

INPUT_DF = "data/dataframes/complete-clean-2022-02-26-is_complete_dataset_true___brains_true___reref_false.pickle"
OUTPUT_CSV = "data/demo_dataset.csv"

def create_neurosky_dataset():
    print(f"Loading original dataset: {INPUT_DF}")
    df = pd.read_pickle(INPUT_DF)
    
    demo_df = pd.DataFrame()
    demo_df["driver_id"] = df["driver_id"]
    demo_df["epoch_id"] = df["epoch_id"]
    demo_df["is_fatigued"] = df["is_fatigued"]
    
    # Map existing features
    alpha_low_cols = [c for c in df.columns if c.endswith("_psd_AL")]
    alpha_high_cols = [c for c in df.columns if c.endswith("_psd_AH")]
    beta_low_cols = [c for c in df.columns if c.endswith("_psd_BL")]
    beta_high_cols = [c for c in df.columns if c.endswith("_psd_BH")]
    
    demo_df["AlphaLow"] = df[alpha_low_cols].mean(axis=1) * 1e18 # Scaling up the PSD values to realistic integer ranges
    demo_df["AlphaHigh"] = df[alpha_high_cols].mean(axis=1) * 1e18
    demo_df["BetaLow"] = df[beta_low_cols].mean(axis=1) * 1e18
    demo_df["BetaHigh"] = df[beta_high_cols].mean(axis=1) * 1e18
    
    # Synthesize remaining NeuroSky features based on fatigue state
    # NeuroSky values (Attention/Meditation) range from 0 to 100
    # Brainwaves typically scaled to positive integers
    
    n_samples = len(df)
    np.random.seed(42)
    
    # Fatigued: Lower attention, higher meditation, higher delta/theta
    is_f = demo_df["is_fatigued"] == 1
    
    demo_df["Attention"] = np.where(is_f, np.random.normal(30, 10, n_samples), np.random.normal(75, 15, n_samples))
    demo_df["Meditation"] = np.where(is_f, np.random.normal(70, 15, n_samples), np.random.normal(40, 15, n_samples))
    demo_df["BlinkStrength"] = np.where(is_f, np.random.normal(80, 20, n_samples), np.random.normal(40, 15, n_samples))
    
    demo_df["Delta"] = np.where(is_f, np.random.normal(800000, 200000, n_samples), np.random.normal(300000, 100000, n_samples))
    demo_df["Theta"] = np.where(is_f, np.random.normal(500000, 100000, n_samples), np.random.normal(200000, 50000, n_samples))
    
    demo_df["GammaLow"] = np.where(is_f, np.random.normal(10000, 5000, n_samples), np.random.normal(30000, 10000, n_samples))
    demo_df["GammaMid"] = np.where(is_f, np.random.normal(5000, 2000, n_samples), np.random.normal(15000, 5000, n_samples))
    
    # Signal Quality (0 means good, higher is worse, typically 0 or 200 if off-head, we'll keep it mostly 0-25)
    demo_df["SignalQuality"] = np.random.randint(0, 15, n_samples)
    
    # Clip to realistic ranges
    demo_df["Attention"] = demo_df["Attention"].clip(1, 100).astype(int)
    demo_df["Meditation"] = demo_df["Meditation"].clip(1, 100).astype(int)
    demo_df["BlinkStrength"] = demo_df["BlinkStrength"].clip(1, 255).astype(int)
    demo_df["Delta"] = demo_df["Delta"].clip(1000, 2000000).astype(int)
    demo_df["Theta"] = demo_df["Theta"].clip(1000, 2000000).astype(int)
    demo_df["GammaLow"] = demo_df["GammaLow"].clip(1000, 100000).astype(int)
    demo_df["GammaMid"] = demo_df["GammaMid"].clip(1000, 100000).astype(int)
    
    # Ensure all mapped PSDs are positive
    demo_df["AlphaLow"] = demo_df["AlphaLow"].abs()
    demo_df["AlphaHigh"] = demo_df["AlphaHigh"].abs()
    demo_df["BetaLow"] = demo_df["BetaLow"].abs()
    demo_df["BetaHigh"] = demo_df["BetaHigh"].abs()
    
    # Reorder columns to the final exact 12
    final_cols = [
        "Attention", "Meditation", "BlinkStrength", 
        "Delta", "Theta", "AlphaLow", "AlphaHigh", 
        "BetaLow", "BetaHigh", "GammaLow", "GammaMid", "SignalQuality"
    ]
    
    # Reorder with labels at start
    demo_df = demo_df[["driver_id", "epoch_id", "is_fatigued"] + final_cols]
    
    demo_df = demo_df.replace([np.inf, -np.inf], np.nan).fillna(0)
    demo_df.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved NeuroSky dataset to {OUTPUT_CSV}")

if __name__ == "__main__":
    create_neurosky_dataset()
