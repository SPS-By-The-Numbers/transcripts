# https://hub.docker.com/_/python
FROM python:3.12-slim

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED 1

# Create and change to the app directory.
WORKDIR /app

RUN <<EOF
  apt-get update -y
  apt-get install git -y
EOF

# Only copy requirements.txt first as this is more stable than source. This lets
# us create 1 layer for requirements that don't change too much.
COPY app/requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

# Copy all app files into /app directory.
COPY app/* /app

# Default startup script.
CMD [ "python",  "find_new_videos.py" ]
