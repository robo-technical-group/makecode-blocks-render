#!/bin/bash
for dir in "$@"
do
    node ./render-blocks.js "${dir}"
done
