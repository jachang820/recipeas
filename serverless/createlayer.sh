#!/bin/bash

# Usage: install.sh [python version] [package-name]
# e.g. install.sh 3.10 Pillow

mkdir create_layer
python -m pip install --target=./create_layer/python/lib/python$1/site-packages --platform manylinux2014_x86_64 --only-binary=:all: --upgrade $2
pushd create_layer
zip -r ../$2_layer.zip python
popd
rm -r create_layer
exec $SHELL