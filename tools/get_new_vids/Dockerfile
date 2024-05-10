# https://hub.docker.com/_/python
FROM python:3.10.6-slim

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED 1

# Create and change to the app directory.
WORKDIR /usr/src

#install git
RUN apt-get -y update
RUN apt-get -y install git

#copy the startup script
COPY startupScript.sh .

#the startup script manages all the initial behaviour
CMD bash startupScript.sh