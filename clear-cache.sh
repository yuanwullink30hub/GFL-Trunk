#!/bin/bash
rm -rf node_modules/.cache
rm -rf .eslintcache
rm -rf build
npm cache clean --force
npm install
npm run build
