#!/bin/bash

cd /home/ubuntu/pronounce-api
npm ci
npm install -g forever

forever start index.js