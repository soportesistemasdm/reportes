FROM node:20-slim

RUN apt-get update && \
    apt-get install -y wget unzip libaio1 libaio-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt/oracle

RUN wget https://download.oracle.com/otn_software/linux/instantclient/1931000/instantclient-basic-linux.x64-19.31.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-19.31.0.0.0dbru.zip \
    && rm instantclient-basic-linux.x64-19.31.0.0.0dbru.zip

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_31

RUN echo "/opt/oracle/instantclient_19_31" > /etc/ld.so.conf.d/oracle.conf && \
    ldconfig

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm","run","dev"]