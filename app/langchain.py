import streamlit as st
import boto3
import langchain

st.title('this is title')
st.header('this is header')
st.subheader('this is subheader')

print(f"langchain version check: {langchain.__version__}")
print(f"boto3 version check: {boto3.__version__}")