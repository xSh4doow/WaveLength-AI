from typing import Dict, Optional


class PromptBuilder:
    """Builds optimized text prompts for MusicGen from caption and musical style."""

    def build(
        self,
        caption: str,
        music_style: Dict,
        user_genre: Optional[str] = None,
        user_tags: Optional[str] = None
    ) -> str:
        """
        Construct a detailed prompt for MusicGen.

        Args:
            caption: Image caption from BLIP
            music_style: Musical style dictionary from CulturalMapper
            user_genre: User-specified genre (priority over music_style if provided)
            user_tags: User-specified tags (comma-separated)

        Returns:
            Formatted prompt string for MusicGen optimized for complete 30s track
        """
        # Strategy: Use user_genre/tags as priority, but keep CulturalMapper elements when no conflict
        # If user_genre provided, use it; otherwise use CulturalMapper genre
        if user_genre and user_genre.strip():
            genre = user_genre.strip()
            # Keep subgenre from CulturalMapper only if it complements the user genre
            subgenre = music_style.get("subgenre", "")
        else:
            # No user genre, use CulturalMapper fully
            genre = music_style.get("genre", "ambient")
            subgenre = music_style.get("subgenre", "")

        # Always use CulturalMapper's mood and BPM as they don't conflict with user choices
        mood = music_style.get("mood", "atmospheric")
        bpm = music_style.get("bpm", 90)
        instrumentation = music_style.get("instrumentation", [])

        # Join instrumentation list
        instrumentation_str = ", ".join(instrumentation) if instrumentation else "synthesizers, pads"

        # Build prompt optimized for 30s complete track
        prompt_parts = []

        # Main genre (user priority or CulturalMapper)
        if subgenre and not user_genre:
            # Only use subgenre if no user genre (to avoid conflicts)
            prompt_parts.append(f"{genre} {subgenre}")
        else:
            prompt_parts.append(genre)

        # User tags ALWAYS take priority and are added first
        if user_tags and user_tags.strip():
            prompt_parts.append(user_tags.strip())

        # Mood and atmosphere from CulturalMapper
        prompt_parts.append(f"{mood} mood")

        # BPM for tempo consistency
        prompt_parts.append(f"{bpm} BPM")

        # Instrumentation (always instrumental, no vocals)
        prompt_parts.append(f"instrumental with {instrumentation_str}")

        # CRITICAL: Structure for complete 30-second song
        # This tells MusicGen to create a full composition, not just a loop
        prompt_parts.append("structured 30-second composition")
        prompt_parts.append("clear intro (0-8s)")
        prompt_parts.append("build-up with melody (8-18s)")
        prompt_parts.append("climax with full arrangement (18-25s)")
        prompt_parts.append("smooth outro and resolution (25-30s)")
        prompt_parts.append("dynamic progression, evolving texture, complete arc")

        # Original inspiration from image
        prompt_parts.append(f"inspired by scene: {caption}")

        # Join all parts with proper separation
        prompt = ", ".join(prompt_parts)

        return prompt
