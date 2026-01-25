#!/bin/bash

###############################################################################
# Git Push Script
# 
# This script adds all changes, commits with message "update", and pushes to main
# Usage: ./scripts/git-push.sh
###############################################################################

git add .
git commit -m "update"
git push origin main

