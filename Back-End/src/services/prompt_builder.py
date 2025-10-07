from typing import Dict


class PromptBuilder:
    """Builds optimized text prompts for MusicGen from caption and musical style."""

    def build(self, caption: str, music_style: Dict) -> str:
        """
        Construct a detailed prompt for MusicGen.

        Args:
            caption: Image caption from BLIP
            music_style: Musical style dictionary from CulturalMapper

        Returns:
            Formatted prompt string for MusicGen
        """
        # Extract style components
        genre = music_style.get("genre", "ambient")
        subgenre = music_style.get("subgenre", "")
        mood = music_style.get("mood", "atmospheric")
        bpm = music_style.get("bpm", 90)
        instrumentation = music_style.get("instrumentation", [])

        # Join instrumentation list
        instrumentation_str = ", ".join(instrumentation) if instrumentation else "soft instruments"

        # Build prompt using template
        # Template: "{genre} {subgenre}, {mood} atmosphere, {bpm} BPM, {instrumentation}, inspired by: {caption}"
        prompt_parts = []

        # Genre and subgenre
        if subgenre:
            prompt_parts.append(f"{genre} {subgenre}")
        else:
            prompt_parts.append(genre)

        # Mood
        prompt_parts.append(f"{mood} atmosphere")

        # BPM
        prompt_parts.append(f"{bpm} BPM")

        # Instrumentation
        prompt_parts.append(instrumentation_str)

        # Inspiration
        prompt_parts.append(f"inspired by: {caption}")

        # Join all parts
        prompt = ", ".join(prompt_parts)

        return prompt
