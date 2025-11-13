"""
Narrative Builder Service
Creates cohesive narratives connecting multiple image captions for music generation.
"""

from typing import List, Dict
import re


class NarrativeBuilder:
    """
    Builds narrative connections between multiple image descriptions.
    """

    # Transition words based on number of images
    TRANSITIONS = {
        2: ["from", "to", "and then", "followed by"],
        3: ["from", "through", "to", "and finally"]
    }

    # Story templates
    STORY_TEMPLATES_2 = [
        "A journey from {scene1} to {scene2}",
        "Moving from {scene1} towards {scene2}",
        "From {scene1} into {scene2}",
        "Transitioning from {scene1} to {scene2}"
    ]

    STORY_TEMPLATES_3 = [
        "A journey from {scene1} through {scene2} to {scene3}",
        "Moving from {scene1} passing through {scene2} towards {scene3}",
        "From {scene1} traveling through {scene2} reaching {scene3}",
        "Transitioning from {scene1} via {scene2} to {scene3}"
    ]

    @staticmethod
    def simplify_caption(caption: str) -> str:
        """
        Simplifies a caption by removing articles and extra words.
        Example: "a beautiful sunset on the beach" -> "beautiful sunset on beach"
        """
        # Remove common articles
        caption = re.sub(r'\b(a|an|the)\b', '', caption, flags=re.IGNORECASE)
        # Remove extra spaces
        caption = ' '.join(caption.split())
        return caption.strip()

    @staticmethod
    def extract_mood_descriptor(moods: List[str]) -> str:
        """
        Extracts a single mood descriptor from a list of moods.
        Returns the first mood or empty string.
        """
        if not moods or len(moods) == 0:
            return ""
        return moods[0]

    @staticmethod
    def find_common_theme(captions_data: List[Dict]) -> str:
        """
        Finds common themes/keywords across all captions.
        Returns a connecting word or phrase.
        """
        # Extract all keywords
        all_keywords = []
        for caption_data in captions_data:
            if "keywords" in caption_data:
                all_keywords.extend(caption_data["keywords"])

        # Find duplicates (common themes)
        keyword_counts = {}
        for keyword in all_keywords:
            keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1

        # Find most common
        common_keywords = [k for k, v in keyword_counts.items() if v > 1]

        if common_keywords:
            return f"exploring {common_keywords[0]}"

        return "a visual journey"

    @classmethod
    def create_narrative(cls, captions_data: List[Dict]) -> Dict[str, any]:
        """
        Creates a narrative connecting multiple image captions.

        Args:
            captions_data: List of dicts with keys:
                - caption: str (BLIP caption)
                - enhanced_caption: str (optional)
                - detected_moods: List[str]
                - keywords: List[str]

        Returns:
            Dict with:
                - narrative: str (connected story)
                - combined_caption: str (concatenated captions)
                - all_moods: List[str] (unique moods from all images)
                - dominant_mood: str (most frequent mood)
        """
        num_images = len(captions_data)

        if num_images == 0:
            return {
                "narrative": "",
                "combined_caption": "",
                "all_moods": [],
                "dominant_mood": ""
            }

        # Single image - no narrative needed
        if num_images == 1:
            caption_data = captions_data[0]
            return {
                "narrative": caption_data.get("caption", ""),
                "combined_caption": caption_data.get("caption", ""),
                "all_moods": caption_data.get("detected_moods", []),
                "dominant_mood": cls.extract_mood_descriptor(caption_data.get("detected_moods", []))
            }

        # Collect all moods
        all_moods = []
        mood_counts = {}
        for caption_data in captions_data:
            moods = caption_data.get("detected_moods", [])
            all_moods.extend(moods)
            for mood in moods:
                mood_counts[mood] = mood_counts.get(mood, 0) + 1

        # Remove duplicates while preserving order
        unique_moods = list(dict.fromkeys(all_moods))

        # Find dominant mood (most frequent)
        dominant_mood = ""
        if mood_counts:
            dominant_mood = max(mood_counts, key=mood_counts.get)

        # Simplify captions
        simplified_scenes = []
        for caption_data in captions_data:
            caption = caption_data.get("caption", "")
            simplified = cls.simplify_caption(caption)

            # Add mood descriptor if available
            mood = cls.extract_mood_descriptor(caption_data.get("detected_moods", []))
            if mood:
                simplified = f"{mood} {simplified}"

            simplified_scenes.append(simplified)

        # Create narrative based on number of images
        if num_images == 2:
            template = cls.STORY_TEMPLATES_2[0]  # Use first template
            narrative = template.format(
                scene1=simplified_scenes[0],
                scene2=simplified_scenes[1]
            )
        elif num_images == 3:
            template = cls.STORY_TEMPLATES_3[0]  # Use first template
            narrative = template.format(
                scene1=simplified_scenes[0],
                scene2=simplified_scenes[1],
                scene3=simplified_scenes[2]
            )
        else:
            # For 4+ images (though we limit to 3, just in case)
            narrative = "A visual journey through " + ", ".join(simplified_scenes)

        # Also create a simple concatenated version
        combined_caption = " AND ".join([cap.get("caption", "") for cap in captions_data])

        return {
            "narrative": narrative,
            "combined_caption": combined_caption,
            "all_moods": unique_moods[:5],  # Limit to 5 moods max
            "dominant_mood": dominant_mood
        }


# Convenience function for direct import
def create_narrative(captions_data: List[Dict]) -> Dict[str, any]:
    """
    Wrapper function for NarrativeBuilder.create_narrative()
    """
    return NarrativeBuilder.create_narrative(captions_data)
