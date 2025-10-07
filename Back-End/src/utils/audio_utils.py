import numpy as np
import scipy.io.wavfile as wavfile


def save_audio(filepath: str, audio_data: np.ndarray, sample_rate: int):
    """
    Save audio data to WAV file.

    Args:
        filepath: Output file path (e.g., "output.wav")
        audio_data: Audio data as numpy array (int16 format)
        sample_rate: Sample rate (e.g., 32000, 44100)
    """
    wavfile.write(filepath, rate=sample_rate, data=audio_data)


def normalize_audio(audio_data: np.ndarray) -> np.ndarray:
    """
    Normalize audio data to prevent clipping.

    Args:
        audio_data: Audio data as numpy array (float or int)

    Returns:
        Normalized audio data
    """
    # Convert to float if needed
    if audio_data.dtype == np.int16:
        audio_float = audio_data.astype(np.float32) / 32767.0
    else:
        audio_float = audio_data.astype(np.float32)

    # Find max absolute value
    max_val = np.abs(audio_float).max()

    # Normalize if needed (avoid division by zero)
    if max_val > 0:
        audio_float = audio_float / max_val * 0.95  # Leave some headroom

    return audio_float
