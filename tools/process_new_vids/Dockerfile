#syntax=docker/dockerfile:1.4

FROM pytorch/pytorch:2.7.0-cuda12.8-cudnn9-runtime

WORKDIR /workspace/app
COPY prime_model.mp4 /workspace/app/

# Use int8 compute type just to make whisperx always complete at this step.
RUN apt-get -y update && \
  apt-get -y install git ffmpeg && \
  pip install whisperx==3.3.4 && \
  whisperx --model=large-v3-turbo --language=en --thread=4 --hf_token=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 --diarize --output_form=json --compute_type=int8 --output_dir=/tmp -- prime_model.mp4

RUN pip install vastai==0.2.8

COPY requirements.txt /workspace/app/
RUN pip install -r requirements.txt

RUN <<EOF
apt-get -y install curl unzip
curl -fsSL https://fnm.vercel.app/install | bash
~/.local/share/fnm/fnm install --lts
EOF

COPY transcribe_worker.py lysine_protocol.sh onstart_hook.sh /workspace/app/
RUN chmod 755 /workspace/app/transcribe_worker.py /workspace/app/lysine_protocol.sh /workspace/app/onstart_hook.sh
