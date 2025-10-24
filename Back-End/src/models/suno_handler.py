import requests
import time
from typing import Optional, Dict, Literal


class SunoHandler:
    """Handler for SunoAPI Music Generation API."""

    def __init__(self, api_key: str, api_url: str = "https://api.sunoapi.org"):
        """
        Initialize SunoAPI handler.

        Args:
            api_key: API key for authentication
            api_url: Base URL for the API (default: https://api.sunoapi.org)
        """
        self.api_key = api_key
        self.api_url = api_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_music(
        self,
        prompt: str = "",
        style: str = "",
        title: str = "",
        custom_mode: bool = True,
        instrumental: bool = True,
        model: str = "V4",
        callback_url: str = ""
    ) -> Dict:
        """
        Generate music using SunoAPI.

        Args:
            prompt:
                - Custom Mode (custom_mode=True): Exact lyrics if instrumental=False, empty if instrumental=True
                - Non-Custom Mode (custom_mode=False): Musical description (max 500 chars)
            style: Music genre/style (required in Custom Mode). Examples: "Jazz", "Rock", "Electronic"
            title: Song title (required in Custom Mode, max 80 chars)
            custom_mode: Use Custom Mode (True) or Non-Custom Mode (False)
            instrumental: Whether to generate instrumental (no vocals)
            model: Model version (V3_5, V4, V4_5, V4_5PLUS, V5)
            callback_url: Optional callback URL (use empty string for polling)

        Returns:
            Dictionary with taskId from API
        """
        # Build request payload
        # Note: SunoAPI requires callBackUrl even for polling mode
        # We use a dummy URL if not provided since we're doing polling
        payload = {
            "customMode": custom_mode,
            "instrumental": instrumental,
            "model": model,
            "callBackUrl": callback_url if callback_url else "https://webhook.site/polling"
        }

        # Add parameters based on mode
        if custom_mode:
            # Custom Mode requires style and title
            if not style or not title:
                raise ValueError("Custom Mode requires 'style' and 'title' parameters")

            payload["style"] = style
            payload["title"] = title

            # Prompt is required only if not instrumental
            if not instrumental:
                if not prompt:
                    raise ValueError("Custom Mode with vocals requires 'prompt' (lyrics)")
                payload["prompt"] = prompt
            # For instrumental, prompt is optional (we can omit it)
        else:
            # Non-Custom Mode requires only prompt
            if not prompt:
                raise ValueError("Non-Custom Mode requires 'prompt' parameter")
            payload["prompt"] = prompt

        # Send request to SunoAPI
        try:
            print(f"[SunoHandler] Generating music with payload: {payload}")
            response = requests.post(
                f"{self.api_url}/api/v1/generate",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()

            # Check for errors
            if result.get("code") != 200:
                raise RuntimeError(f"SunoAPI error: {result.get('msg', 'Unknown error')}")

            print(f"[SunoHandler] Task created: {result}")
            return result

        except requests.exceptions.RequestException as e:
            print(f"[SunoHandler] API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"[SunoHandler] Response: {e.response.text}")
            raise

    def check_status(self, task_id: str) -> Dict:
        """
        Check status of a music generation task.

        Args:
            task_id: Task ID returned from generate_music()

        Returns:
            Dictionary with status, response data, and result URLs if completed
        """
        try:
            response = requests.get(
                f"{self.api_url}/api/v1/generate/record-info",
                params={"taskId": task_id},
                headers=self.headers,
                timeout=15
            )
            response.raise_for_status()
            result = response.json()

            # Check for errors
            if result.get("code") != 200:
                raise RuntimeError(f"SunoAPI error: {result.get('msg', 'Unknown error')}")

            status = result.get("data", {}).get("status", "UNKNOWN")
            print(f"[SunoHandler] Status for {task_id}: {status}")
            return result

        except requests.exceptions.RequestException as e:
            print(f"[SunoHandler] Status check failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"[SunoHandler] Response: {e.response.text}")
            raise

    def generate_lyrics(
        self,
        prompt: str,
        callback_url: str = ""
    ) -> Dict:
        """
        Generate lyrics using SunoAPI.

        Args:
            prompt: Description of desired lyrics content (max 200 words)
            callback_url: Optional callback URL (use empty string for polling)

        Returns:
            Dictionary with taskId from API
        """
        payload = {
            "prompt": prompt,
            "callBackUrl": callback_url if callback_url else "https://webhook.site/polling"
        }

        try:
            print(f"[SunoHandler] Generating lyrics with prompt: {prompt[:100]}...")
            response = requests.post(
                f"{self.api_url}/api/v1/lyrics",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()

            # Check for errors
            if result.get("code") != 200:
                raise RuntimeError(f"SunoAPI lyrics error: {result.get('msg', 'Unknown error')}")

            print(f"[SunoHandler] Lyrics task created: {result}")
            return result

        except requests.exceptions.RequestException as e:
            print(f"[SunoHandler] Lyrics API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"[SunoHandler] Response: {e.response.text}")
            raise

    def check_lyrics_status(self, task_id: str) -> Dict:
        """
        Check status of a lyrics generation task.

        Args:
            task_id: Task ID returned from generate_lyrics()

        Returns:
            Dictionary with status and lyrics data if completed
        """
        try:
            response = requests.get(
                f"{self.api_url}/api/v1/lyrics/record-info",
                params={"taskId": task_id},
                headers=self.headers,
                timeout=15
            )
            response.raise_for_status()
            result = response.json()

            # Check for errors
            if result.get("code") != 200:
                raise RuntimeError(f"SunoAPI lyrics status error: {result.get('msg', 'Unknown error')}")

            status = result.get("data", {}).get("status", "UNKNOWN")
            print(f"[SunoHandler] Lyrics status for {task_id}: {status}")
            return result

        except requests.exceptions.RequestException as e:
            print(f"[SunoHandler] Lyrics status check failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"[SunoHandler] Response: {e.response.text}")
            raise

    def wait_for_completion(
        self,
        task_id: str,
        timeout: int = 300,
        poll_interval: int = 10,
        task_type: str = "music"
    ) -> Dict:
        """
        Wait for task to complete with polling.

        Args:
            task_id: Task ID to monitor
            timeout: Maximum wait time in seconds (default: 5 minutes)
            poll_interval: Seconds between status checks (default: 10s)
            task_type: Type of task ("music" or "lyrics")

        Returns:
            Final task result when completed

        Raises:
            TimeoutError: If task doesn't complete within timeout
            RuntimeError: If task fails
        """
        start_time = time.time()

        while True:
            # Check if timeout exceeded
            elapsed = time.time() - start_time
            if elapsed > timeout:
                raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")

            # Check status based on task type
            if task_type == "lyrics":
                status_data = self.check_lyrics_status(task_id)
            else:
                status_data = self.check_status(task_id)

            # Extract status (handle both music and lyrics response formats)
            data = status_data.get("data")
            if not data:
                raise RuntimeError(f"Invalid response: no data field")

            task_status = data.get("status", "UNKNOWN")

            print(f"[SunoHandler] Task {task_id} ({task_type}): {task_status} ({elapsed:.1f}s elapsed)")

            # Check completion status
            if task_status == "SUCCESS":
                return status_data
            elif task_status in ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "GENERATE_LYRICS_FAILED",
                                "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"]:
                error_msg = data.get("errorMessage", "Unknown error")
                raise RuntimeError(f"Task failed: {error_msg}")

            # Wait before next poll
            time.sleep(poll_interval)

    def get_credits(self) -> int:
        """
        Get remaining credits for the account.

        Returns:
            Number of remaining credits
        """
        try:
            response = requests.get(
                f"{self.api_url}/api/v1/generate/credit",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()

            # Check for errors
            if result.get("code") != 200:
                raise RuntimeError(f"SunoAPI error: {result.get('msg', 'Unknown error')}")

            credits = result.get("data", 0)
            print(f"[SunoHandler] Remaining credits: {credits}")
            return credits

        except requests.exceptions.RequestException as e:
            print(f"[SunoHandler] Credits check failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"[SunoHandler] Response: {e.response.text}")
            raise

    def is_available(self) -> bool:
        """
        Check if API is available and credentials are valid.

        Returns:
            True if API is reachable and authenticated
        """
        try:
            # Try to get credits to validate API key
            self.get_credits()
            return True
        except:
            return False
