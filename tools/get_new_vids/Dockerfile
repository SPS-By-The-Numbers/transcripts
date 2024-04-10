# https://hub.docker.com/_/python
FROM python:3.10.6-slim

# Create and change to the app directory.
WORKDIR /

COPY setupScript.sh .

RUN setupScript.sh

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY startupScript.sh .

#the startup script manages all the initial behaviour
CMD bash startupScript.sh