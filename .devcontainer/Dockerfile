FROM node:14-bullseye-slim

RUN apt update
RUN apt install -y git


ARG USER_UID=1000
ARG USER_GID=1000
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then groupmod --gid $USER_GID node && usermod --uid $USER_UID --gid $USER_GID node; fi
