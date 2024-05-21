FROM pytorch/pytorch

WORKDIR /workspace/app
COPY prime_model.mp4 /workspace/app/

RUN <<EOF bash
  apt-get -y update
  apt-get -y install git ffmpeg

  pip install git+https://github.com/m-bain/whisperx.git
  # Use int8 compute type just to make whisperx always complete at this step.
  whisperx --model=large-v3 --language=en --thread=4 --hf_token=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 --diarize --output_form=json --compute_type=int8 --output_dir=/tmp -- prime_model.mp4
EOF

COPY requirements.txt /workspace/app/
RUN  pip install -r requirements.txt


COPY transcribe_worker.py lysine_protocol.sh onstart.sh
