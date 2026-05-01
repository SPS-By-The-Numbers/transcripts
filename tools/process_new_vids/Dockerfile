#syntax=docker/dockerfile:1.4

FROM pytorch/pytorch:2.10.0-cuda13.0-cudnn9-runtime

WORKDIR /workspace/app
COPY prime_model.mp4 /workspace/app/

# Install all the programs and setup the paths.
RUN <<EOF
  apt-get -y update
  apt-get -y install git ffmpeg libavutil-dev python3.12-venv vim curl unzip
  apt clean

  mkdir -p /workspace/venv
  mkdir -p /workspace/tmp
EOF

# Install deno so yt-dlp has a JS runtime for YouTube extraction.
RUN <<EOF
  curl -fsSL https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip -o /tmp/deno.zip
  unzip /tmp/deno.zip -d /usr/local/bin/
  rm /tmp/deno.zip
  chmod 755 /usr/local/bin/deno
EOF

RUN <<EOF
  python -m venv /workspace/venv/whisperx
  . /workspace/venv/whisperx/bin/activate
  pip install whisperx==3.8.2
EOF

# Download models into image.
# Use int8 compute type just to make whisperx always complete at this step.
RUN --mount=type=secret,id=HF_TOKEN <<EOF
  . /workspace/venv/whisperx/bin/activate
  export HF_TOKEN=$(cat /run/secrets/HF_TOKEN)
  whisperx --model=large-v3 --language=en --thread=4 --hf_token="${HF_TOKEN}" --diarize --output_form=json --compute_type=int8 --output_dir=/tmp -- prime_model.mp4
EOF

RUN <<EOF
  python -m venv /workspace/venv/vast
  . /workspace/venv/vast/bin/activate
  pip install vastai==0.5.0
EOF

COPY requirements.txt /workspace/app/
RUN <<EOF
  . /workspace/venv/whisperx/bin/activate
  pip install -r requirements.txt
EOF

COPY transcribe_worker.py lysine_protocol.sh onstart_hook.sh /workspace/app/
RUN chmod 755 /workspace/app/transcribe_worker.py /workspace/app/lysine_protocol.sh /workspace/app/onstart_hook.sh
