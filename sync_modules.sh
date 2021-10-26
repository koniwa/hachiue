#!/usr/bin/env bash

rm -rf src/3rd/

mkdir -p src/3rd/bootstrap/js/
rsync -avP node_modules/bootstrap/dist/js/bootstrap.min.js* \
    src/3rd/bootstrap/js/

mkdir -p src/3rd/bootstrap/css/
rsync -avP node_modules/bootstrap/dist/css/bootstrap.min.css* \
    src/3rd/bootstrap/css/

mkdir -p src/3rd/bootstrap-icons
rsync -avP node_modules/bootstrap-icons/font/bootstrap-icons.css \
    src/3rd/bootstrap-icons

mkdir -p src/3rd/bootstrap-icons/fonts
rsync -avP node_modules/bootstrap-icons/font/fonts/ \
    src/3rd/bootstrap-icons/fonts

mkdir -p src/3rd/wavesurfer.js
rsync -avP node_modules/wavesurfer.js/dist/wavesurfer.min.js* \
    src/3rd/wavesurfer.js

mkdir -p src/3rd/wavesurfer.js/plugin
rsync -avP node_modules/wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js* \
    node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions.min.js* \
    node_modules/wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js* \
    src/3rd/wavesurfer.js/plugin

mkdir -p src/3rd/localforage
rsync -avP node_modules/localforage/dist/localforage.min.js \
    src/3rd/localforage
