from typing import Dict, Optional


class PromptBuilder:
    """Builds optimized text prompts for music generation API from caption and musical style."""

    def build_for_custom_mode(
        self,
        caption: str,
        music_style: Dict,
        user_genre: Optional[str] = None,
        user_tags: Optional[str] = None,
        song_name: Optional[str] = None,
        has_vocals: bool = False,
        include_title_in_lyrics: bool = True
    ) -> tuple[str, str, str]:
        """
        Build parameters for SunoAPI Custom Mode.

        Args:
            caption: Image caption from BLIP
            music_style: Musical style dictionary from CulturalMapper
            user_genre: User-specified genre (priority over music_style if provided)
            user_tags: User-specified tags (comma-separated)
            song_name: Name of the song
            has_vocals: Whether the music should have vocals
            include_title_in_lyrics: Whether to include song name in the lyrics prompt

        Returns:
            Tuple of (style, title, lyrics_prompt):
            - style: Genre/style for the music (e.g., "Jazz", "Rock")
            - title: Song title (max 80 chars)
            - lyrics_prompt: Description for lyrics generation (empty if instrumental)
        """
        # 1. Build STYLE (genre)
        if user_genre and user_genre.strip():
            style = user_genre.strip().title()  # Capitalize properly
        else:
            genre = music_style.get("genre", "Epic Cinematic")
            subgenre = music_style.get("subgenre", "")
            if subgenre:
                style = f"{genre.title()} {subgenre.title()}"
            else:
                style = genre.title()

        # Add user tags to style if provided
        if user_tags and user_tags.strip():
            # Capitalize each tag
            tags_list = [tag.strip().title() for tag in user_tags.split(",")]
            tags_str = ", ".join(tags_list)
            style = f"{style}, {tags_str}"

        # 2. Build TITLE
        if song_name and song_name.strip():
            title = song_name.strip()[:80]  # Max 80 characters
        else:
            title = "Untitled"

        # 3. Build LYRICS PROMPT (only if has vocals)
        # IMPORTANT: SunoAPI has 200 CHARACTER limit (not words!)
        lyrics_prompt = ""
        if has_vocals:
            # Build CONCISE prompt (max 200 chars)
            name_lower = song_name.strip().lower() if song_name else ""

            # Detect key theme and create SHORT description
            if "wukong" in name_lower or "monkey king" in name_lower:
                theme = "legendary Monkey King returns, ancient power awakens"
            elif "battle" in name_lower or "war" in name_lower or "fight" in name_lower:
                theme = "intense battle, warrior's spirit, fighting for honor"
            elif "sorry" in name_lower or "forgive" in name_lower:
                theme = "regret and redemption, seeking forgiveness, emotional pain"
            elif "dark" in name_lower or "shadow" in name_lower:
                theme = "mysterious darkness, shadows lurking, ominous atmosphere"
            elif "hero" in name_lower or "legend" in name_lower:
                theme = "legendary hero's journey, epic courage and bravery"
            elif "dream" in name_lower or "hope" in name_lower:
                theme = "hopeful dreams, rising inspiration, light conquering dark"
            elif "brother" in name_lower:
                theme = "brotherhood bond, loyalty and sacrifice, family connection"
            else:
                # Generic based on caption/mood
                mood = music_style.get("mood", "emotional")
                theme = f"{mood} story"

            # Build final prompt (KEEP UNDER 200 CHARS!)
            if include_title_in_lyrics and song_name and song_name.strip():
                # Include title reference
                lyrics_prompt = f"Song: '{song_name.strip()}'. {theme}."
            else:
                # No title reference
                lyrics_prompt = f"{theme.capitalize()}."

            # ENFORCE 200 character limit
            if len(lyrics_prompt) > 200:
                lyrics_prompt = lyrics_prompt[:197] + "..."

            print(f"[PromptBuilder] Lyrics prompt ({len(lyrics_prompt)} chars): {lyrics_prompt}")

        return (style, title, lyrics_prompt)

    def build(
        self,
        caption: str,
        music_style: Dict,
        user_genre: Optional[str] = None,
        user_tags: Optional[str] = None,
        song_name: Optional[str] = None,
        has_vocals: bool = False,
        has_lyrics: bool = False
    ) -> str:
        """
        Construct a detailed, narrative-rich prompt for music generation API (SunoAPI).

        Args:
            caption: Image caption from BLIP
            music_style: Musical style dictionary from CulturalMapper
            user_genre: User-specified genre (priority over music_style if provided)
            user_tags: User-specified tags (comma-separated)
            song_name: Name of the song (helps contextualize the generation)
            has_vocals: Whether the music should have vocals
            has_lyrics: Whether to generate lyrics

        Returns:
            Formatted prompt string optimized for SunoAPI
        """
        # Use user genre if provided, otherwise CulturalMapper
        if user_genre and user_genre.strip():
            genre = user_genre.strip()
            subgenre = music_style.get("subgenre", "")
        else:
            genre = music_style.get("genre", "epic cinematic")
            subgenre = music_style.get("subgenre", "")

        mood = music_style.get("mood", "powerful and atmospheric")
        bpm = music_style.get("bpm", 120)

        # Build narrative-rich description
        narrative_parts = []

        # 1. Core genre and mood
        if subgenre and not user_genre:
            narrative_parts.append(f"{genre} {subgenre}")
        else:
            narrative_parts.append(genre)

        # 2. Extract essence from song name if provided
        if song_name and song_name.strip():
            name_lower = song_name.strip().lower()

            # Detect key themes and emotions from the song name
            if "wukong" in name_lower or "monkey king" in name_lower:
                narrative_parts.append("legendary Chinese mythology")
                narrative_parts.append("heroic return of the Monkey King")
                narrative_parts.append("ancient power awakening")

            if "back" in name_lower or "return" in name_lower:
                narrative_parts.append("triumphant comeback")
                narrative_parts.append("rediscovery of forgotten strength")

            if "dark" in name_lower or "shadow" in name_lower:
                narrative_parts.append("mysterious and ominous")
                narrative_parts.append("lurking darkness")

            if "hero" in name_lower or "legend" in name_lower:
                narrative_parts.append("legendary tale")
                narrative_parts.append("epic heroism")

            if "battle" in name_lower or "war" in name_lower or "fight" in name_lower:
                narrative_parts.append("intense battle atmosphere")
                narrative_parts.append("warrior's determination")

            if "dream" in name_lower or "hope" in name_lower:
                narrative_parts.append("hopeful and inspiring")
                narrative_parts.append("dreams coming alive")

            # Add the title itself as context
            narrative_parts.append(f"titled '{song_name.strip()}'")

        # 3. User tags (high priority)
        if user_tags and user_tags.strip():
            narrative_parts.append(user_tags.strip())

        # 4. Mood description
        narrative_parts.append(f"{mood}")

        # 5. Musical characteristics
        narrative_parts.append(f"{bpm} BPM")

        # 6. Instrumentation (only if instrumental)
        if not has_vocals:
            instrumentation = music_style.get("instrumentation", ["orchestral strings", "epic drums", "powerful brass"])
            instrumentation_str = ", ".join(instrumentation)
            narrative_parts.append(f"featuring {instrumentation_str}")

        # 7. Production quality
        narrative_parts.append("cinematic production")
        narrative_parts.append("dynamic range")
        narrative_parts.append("immersive soundscape")

        # 8. Structure
        narrative_parts.append("dramatic build-up")
        narrative_parts.append("powerful climax")
        narrative_parts.append("memorable resolution")

        # 9. Emotional journey
        if "wukong" in song_name.lower() if song_name else False:
            narrative_parts.append("journey from mystery to revelation")
            narrative_parts.append("awakening of ancient power")
        else:
            narrative_parts.append("emotional narrative arc")

        # 10. Scene inspiration (compressed)
        if caption and len(caption) > 10:
            # Simplify caption to key elements
            caption_simplified = caption.replace("this is an image of", "").strip()
            narrative_parts.append(f"inspired by: {caption_simplified}")

        # Join all parts with proper separation
        prompt = ", ".join(narrative_parts)

        # Limit to ~500 chars for Non-Custom mode (SunoAPI requirement)
        if len(prompt) > 500:
            prompt = prompt[:497] + "..."

        return prompt
