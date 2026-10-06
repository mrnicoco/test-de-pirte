#!/usr/bin/env python3
"""Reconstruit index.html à partir de src/ (coquille HTML + app.js + questions.js).
Usage : python3 tools/build.py   (depuis la racine du repo)"""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
read = lambda p: open(os.path.join(SRC, p), encoding='utf-8').read()
shell, app, data = read('index.src.html'), read('app.js'), read('questions.js').strip()
assert 'window.POP_DATA' in data
assert '</script' not in data.lower() and '</script' not in app.lower()
out = shell.replace('<!--@DATA-->', data).replace('<!--@APP-->', app)
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)
print('index.html reconstruit :', len(out), 'octets')
