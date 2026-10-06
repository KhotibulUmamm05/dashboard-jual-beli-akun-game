"""Menampilkan dashboard (docs/index.html) di Streamlit Community Cloud."""
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Dashboard Jual Beli Akun Game · PT XYZ", layout="wide")

# rapatkan tampilan bawaan Streamlit agar dashboard memenuhi layar
st.markdown(
    """
    <style>
      #MainMenu, header[data-testid="stHeader"], footer { display: none; }
      .block-container, [data-testid="stMainBlockContainer"] { padding: 0 !important; max-width: 100% !important; }
      [data-testid="stAppViewContainer"] iframe { height: 100vh !important; display: block; }
      [data-testid="stVerticalBlock"] { gap: 0 !important; }
      [data-testid="stElementContainer"]:has(style) { display: none; }
    </style>
    """,
    unsafe_allow_html=True,
)

html = (Path(__file__).parent / "docs" / "index.html").read_text(encoding="utf-8")
components.html(html, height=900, scrolling=True)
