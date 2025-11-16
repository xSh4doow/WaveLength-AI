from typing import Dict, List


class CulturalMapper:
    """Maps image captions to musical styles based on cultural and contextual keywords."""

    STYLE_MAPPINGS = {
        "beach_sunset": {
            "keywords": ["beach", "sunset", "tropical", "palm"],
            "style": {
                "genre": "tropical house",
                "subgenre": "chill",
                "bpm": 85,
                "mood": "relaxing and warm",
                "instrumentation": ["soft synths", "light percussion", "warm pads"]
            }
        },
        "coastal_highway": {
            "keywords": ["highway", "coastal", "road", "ocean", "drive"],
            "style": {
                "genre": "french house",
                "subgenre": "indie chill",
                "bpm": 120,
                "mood": "nostalgic and golden",
                "instrumentation": ["warm synth pads", "golden rhodes", "soft drums"]
            }
        },
        "city_night_neon": {
            "keywords": ["city", "night", "neon", "lights", "urban"],
            "style": {
                "genre": "synthwave",
                "subgenre": "cyberpunk",
                "bpm": 110,
                "mood": "energetic and vibrant",
                "instrumentation": ["neon synths", "punchy bass", "electric drums"]
            }
        },
        "nature_forest": {
            "keywords": ["forest", "trees", "nature", "green", "woods"],
            "style": {
                "genre": "ambient",
                "subgenre": "cinematic",
                "bpm": 70,
                "mood": "peaceful and serene",
                "instrumentation": ["ethereal pads", "nature sounds", "soft strings"]
            }
        },
        "mountain_landscape": {
            "keywords": ["mountain", "peak", "alpine", "snow"],
            "style": {
                "genre": "epic orchestral",
                "subgenre": "cinematic",
                "bpm": 80,
                "mood": "majestic and grand",
                "instrumentation": ["strings", "brass", "timpani"]
            }
        },
        "desert_sunset": {
            "keywords": ["desert", "sand", "dunes", "arid"],
            "style": {
                "genre": "ethnic ambient",
                "subgenre": "world music",
                "bpm": 85,
                "mood": "mysterious and warm",
                "instrumentation": ["ethnic flutes", "hand drums", "ambient pads"]
            }
        },
        "rainy_city": {
            "keywords": ["rain", "wet", "street", "city", "drops"],
            "style": {
                "genre": "lo-fi hip hop",
                "subgenre": "jazzy",
                "bpm": 85,
                "mood": "mellow and contemplative",
                "instrumentation": ["jazzy piano", "vinyl crackling", "soft drums"]
            }
        },
        "cafe_interior": {
            "keywords": ["cafe", "coffee", "indoor", "cozy"],
            "style": {
                "genre": "bossa nova",
                "subgenre": "modern jazz",
                "bpm": 95,
                "mood": "cozy and romantic",
                "instrumentation": ["acoustic guitar", "soft piano", "light drums"]
            }
        },
        "night_skyline": {
            "keywords": ["skyline", "skyscraper", "downtown", "building"],
            "style": {
                "genre": "downtempo electronic",
                "subgenre": "chill",
                "bpm": 100,
                "mood": "sophisticated and urban",
                "instrumentation": ["clean synths", "crisp hi-hats", "deep bass"]
            }
        },
        "tropical_beach": {
            "keywords": ["tropical", "caribbean", "turquoise", "paradise"],
            "style": {
                "genre": "reggae fusion",
                "subgenre": "tropical",
                "bpm": 90,
                "mood": "joyful and carefree",
                "instrumentation": ["steel drums", "ukulele", "light percussion"]
            }
        },
        "urban_street": {
            "keywords": ["street", "graffiti", "urban", "concrete"],
            "style": {
                "genre": "hip hop beats",
                "subgenre": "urban",
                "bpm": 95,
                "mood": "energetic and raw",
                "instrumentation": ["heavy bass", "snare", "vinyl samples"]
            }
        },
        "futuristic_tech": {
            "keywords": ["futuristic", "technology", "digital", "cyber"],
            "style": {
                "genre": "electronic",
                "subgenre": "tech house",
                "bpm": 125,
                "mood": "modern and sleek",
                "instrumentation": ["digital synths", "electronic drums", "glitch effects"]
            }
        },

        # === HUMAN/PORTRAIT CATEGORIES ===
        "portrait_happy": {
            "keywords": ["smiling", "smile", "laughing", "laugh", "happy", "cheerful", "grinning", "joy"],
            "style": {
                "genre": "indie pop",
                "subgenre": "upbeat",
                "bpm": 115,
                "mood": "cheerful and uplifting",
                "instrumentation": ["acoustic guitar", "ukulele", "hand claps", "bright synths"]
            }
        },
        "portrait_serious": {
            "keywords": ["man", "woman", "person", "people", "portrait", "face", "looking", "standing", "sitting"],
            "style": {
                "genre": "indie folk",
                "subgenre": "intimate",
                "bpm": 85,
                "mood": "contemplative and personal",
                "instrumentation": ["acoustic guitar", "soft vocals", "gentle piano"]
            }
        },
        "action_scene": {
            "keywords": ["running", "jumping", "fighting", "moving", "action", "walking", "dancing"],
            "style": {
                "genre": "electronic rock",
                "subgenre": "energetic",
                "bpm": 140,
                "mood": "intense and driving",
                "instrumentation": ["electric guitar", "synth bass", "powerful drums"]
            }
        },
        "object_close_up": {
            "keywords": ["holding", "hand", "hands", "object", "item", "close", "bottle", "cup", "phone"],
            "style": {
                "genre": "lo-fi hip hop",
                "subgenre": "chill",
                "bpm": 80,
                "mood": "relaxed and focused",
                "instrumentation": ["jazzy piano", "soft drums", "vinyl texture"]
            }
        }
    }

    def map_caption_to_style(self, caption: str) -> Dict:
        """
        Map caption to musical style based on keyword matching.

        Args:
            caption: Image caption from BLIP

        Returns:
            Dictionary with genre, subgenre, bpm, mood, instrumentation
        """
        caption_lower = caption.lower()

        # Try to match specific categories (prefer multiple keyword matches)
        best_match = None
        best_match_count = 0

        for category_name, category_data in self.STYLE_MAPPINGS.items():
            keywords = category_data["keywords"]
            match_count = sum(1 for kw in keywords if kw in caption_lower)

            if match_count > best_match_count:
                best_match_count = match_count
                best_match = category_data["style"]

        # If we found a match with at least one keyword, use it
        if best_match and best_match_count > 0:
            return best_match.copy()

        # Default fallback: use smart fallback
        return self.get_smart_fallback(caption)

    def get_smart_fallback(self, caption: str) -> Dict:
        """
        Smart fallback when no keywords match.
        Analyzes caption content to suggest appropriate genre.

        Args:
            caption: Image caption from BLIP

        Returns:
            Dictionary with genre, subgenre, bpm, mood, instrumentation
        """
        caption_lower = caption.lower()

        # Detecta presença de pessoas
        if any(word in caption_lower for word in ["man", "woman", "person", "people", "child", "group", "someone"]):
            # Detecta emoção positiva
            if any(word in caption_lower for word in ["smiling", "smile", "happy", "laugh", "joy"]):
                return {
                    "genre": "indie pop",
                    "subgenre": "cheerful",
                    "bpm": 110,
                    "mood": "joyful and lighthearted",
                    "instrumentation": ["acoustic guitar", "ukulele", "light percussion"]
                }
            # Pessoa neutra/séria
            else:
                return {
                    "genre": "indie folk",
                    "subgenre": "storytelling",
                    "bpm": 90,
                    "mood": "personal and reflective",
                    "instrumentation": ["acoustic guitar", "soft piano", "strings"]
                }

        # Detecta objetos/still life
        if any(word in caption_lower for word in ["holding", "object", "item", "bottle", "book", "phone", "cup", "glass"]):
            return {
                "genre": "lo-fi hip hop",
                "subgenre": "chill",
                "bpm": 85,
                "mood": "relaxed and focused",
                "instrumentation": ["jazzy piano", "soft drums", "vinyl texture"]
            }

        # Detecta natureza/paisagem (mais genérico)
        if any(word in caption_lower for word in ["landscape", "view", "scene", "scenery", "outdoor"]):
            return {
                "genre": "ambient folk",
                "subgenre": "natural",
                "bpm": 75,
                "mood": "peaceful and organic",
                "instrumentation": ["acoustic guitar", "nature sounds", "soft pads"]
            }

        # Fallback padrão (mantém ambient mas com variação)
        return {
            "genre": "ambient",
            "subgenre": "neutral",
            "bpm": 90,
            "mood": "calm and atmospheric",
            "instrumentation": ["soft pads", "gentle tones"]
        }

    def get_all_categories(self) -> List[str]:
        """Get list of all available category names."""
        return list(self.STYLE_MAPPINGS.keys())
