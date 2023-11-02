from pyannote.audio import Pipeline
import whisper

# Cache the models. Useful for creating the Docker image.
Pipeline.from_pretrained("pyannote/speaker-diarization-3.0", use_auth_token="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")
whisper.load_model('large-v2')

