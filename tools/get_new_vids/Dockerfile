# Copyright 2021 Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.10.6-slim

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED 1

# Create and change to the app directory.
WORKDIR /usr/src/app

# Install dependencies.
#RUN pip install -r requirements.txt

# Copy local code to the container image.
COPY . .

#install git
#RUN apt-get -y update
#RUN apt-get -y install git

#install dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "./app.py"]