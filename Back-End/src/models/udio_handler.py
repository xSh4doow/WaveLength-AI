import requests
import time
import os
from typing import Optional, Dict, Literal
import numpy as np


class UdioHandler:
    """Handler for Udio/Suno AI Music Generation API."""

    def __init__(self, api_key: str, api_url: str = "https://api.udio.com/v1"):
        """
        Initialize Udio API handler.

        Args:
            api_key: API key for authentication
            api_url: Base URL for the API (default: Udio API)
        """
        self.api_key = api_key
        self.api_url = api_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_music(
        self,
        prompt: str,
        lyrics_type: Literal["generate", "instrumental", "user"] = "instrumental",
        lyrics: Optional[str] = None,
        negative_tags: str = "",
        seed: int = -1,
        webhook_endpoint: str = "",
        webhook_secret: str = ""
    ) -> Dict:
        """
        Generate music using Udio API.

        Args:
            prompt: Musical description prompt (genre, mood, style, etc.)
            lyrics_type: "generate" | "instrumental" | "user"
            lyrics: User-provided lyrics (required if lyrics_type="user")
            negative_tags: Tags to avoid in generation
            seed: Random seed for reproducibility (-1 for random)
            webhook_endpoint: Optional webhook URL for completion notification
            webhook_secret: Secret for webhook authentication

        Returns:
            Dictionary with task_id and initial status
        """
        # Validate lyrics requirement
        if lyrics_type == "user" and not lyrics:
            raise ValueError("lyrics must be provided when lyrics_type='user'")

        # Build request payload
        payload = {
            "model": "music-u",
            "task_type": "generate_music",
            "input": {
                "gpt_description_prompt": prompt,
                "negative_tags": negative_tags,
                "lyrics_type": lyrics_type,
                "seed": seed
            },
            "config": {
                "service_mode": "public",
                "webhook_config": {
                    "endpoint": webhook_endpoint,
                    "secret": webhook_secret
                }
            }
        }

        # Add lyrics if provided
        if lyrics_type == "user" and lyrics:
            payload["input"]["lyrics"] = lyrics

        # Send request
        try:
            response = requests.post(
                f"{self.api_url}/tasks/create",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"[UdioHandler] API request failed: {e}")
            raise

    def check_status(self, task_id: str) -> Dict:
        """
        Check status of a music generation task.

        Args:
            task_id: Task ID returned from generate_music()

        Returns:
            Dictionary with status, progress, and result URL if completed
        """
        try:
            response = requests.get(
                f"{self.api_url}/tasks/{task_id}",
                headers=self.headers,
                timeout=15
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"[UdioHandler] Status check failed: {e}")
            raise

    def wait_for_completion(
        self,
        task_id: str,
        timeout: int = 300,
        poll_interval: int = 5
    ) -> Dict:
        """
        Wait for task to complete with polling.

        Args:
            task_id: Task ID to monitor
            timeout: Maximum wait time in seconds (default: 5 minutes)
            poll_interval: Seconds between status checks (default: 5s)

        Returns:
            Final task result when completed

        Raises:
            TimeoutError: If task doesn't complete within timeout
        """
        start_time = time.time()

        while True:
            # Check if timeout exceeded
            elapsed = time.time() - start_time
            if elapsed > timeout:
                raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")

            # Check status
            status_data = self.check_status(task_id)
            task_status = status_data.get("status", "unknown")

            print(f"[UdioHandler] Task {task_id}: {task_status} ({elapsed:.1f}s elapsed)")

            # Check if completed
            if task_status == "completed":
                return status_data
            elif task_status in ["failed", "error"]:
                error_msg = status_data.get("error", "Unknown error")
                raise RuntimeError(f"Task failed: {error_msg}")

            # Wait before next poll
            time.sleep(poll_interval)

    def download_audio(self, audio_url: str, save_path: str) -> str:
        """
        Download generated audio file from URL.

        Args:
            audio_url: URL to the generated audio file
            save_path: Local path to save the audio file

        Returns:
            Path to the saved file
        """
        try:
            response = requests.get(audio_url, timeout=60, stream=True)
            response.raise_for_status()

            # Save to file
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"[UdioHandler] Audio saved to: {save_path}")
            return save_path

        except requests.exceptions.RequestException as e:
            print(f"[UdioHandler] Download failed: {e}")
            raise

    def generate_and_download(
        self,
        prompt: str,
        save_path: str,
        lyrics_type: Literal["generate", "instrumental", "user"] = "instrumental",
        lyrics: Optional[str] = None,
        timeout: int = 300
    ) -> tuple[str, Dict]:
        """
        Complete workflow: generate music and download when ready.

        Args:
            prompt: Musical description
            save_path: Where to save the audio file
            lyrics_type: Type of lyrics generation
            lyrics: User lyrics if lyrics_type="user"
            timeout: Maximum wait time

        Returns:
            Tuple of (saved_file_path, task_metadata)
        """
        # Step 1: Create generation task
        print(f"[UdioHandler] Creating music generation task...")
        task_data = self.generate_music(
            prompt=prompt,
            lyrics_type=lyrics_type,
            lyrics=lyrics
        )
        task_id = task_data.get("task_id")

        if not task_id:
            raise RuntimeError("Failed to create task: no task_id returned")

        # Step 2: Wait for completion
        print(f"[UdioHandler] Waiting for task {task_id} to complete...")
        result = self.wait_for_completion(task_id, timeout=timeout)

        # Step 3: Download audio
        audio_url = result.get("result", {}).get("audio_url")
        if not audio_url:
            raise RuntimeError("Task completed but no audio_url found")

        print(f"[UdioHandler] Downloading audio from: {audio_url}")
        final_path = self.download_audio(audio_url, save_path)

        return final_path, result

    def is_available(self) -> bool:
        """
        Check if API is available and credentials are valid.

        Returns:
            True if API is reachable and authenticated
        """
        try:
            # Simple health check (adjust endpoint based on actual API)
            response = requests.get(
                f"{self.api_url}/health",
                headers=self.headers,
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
