# Reference: https://gitlab.aws.dev/dabounds/gen-ai-demos/-/blob/development/pages/GenAI_Agile_Guru.py

import json
import boto3
import streamlit as st
import datetime
from io import BytesIO
from PIL import Image
import numpy as np
import base64
import uuid
import string
import os
import sys

module_path = "."
sys.path.append(os.path.abspath(module_path))

from utils import bedrock

bedrock_region = "us-west-2" 
bedrock_config = {
    "region_name":bedrock_region,
    "endpoint_url":"https://prod.us-west-2.frontend.bedrock.aws.dev"
}
    
boto3_bedrock = bedrock.get_bedrock_client(
    region=bedrock_config["region_name"],
    url_override=bedrock_config["endpoint_url"]
)
#modelInfo = boto3_bedrock.list_foundation_models()    
#print('models: ', modelInfo)
model_id = "amazon.titan-tg1-large"

def call_bedrock_titan(query):
    prompt_text = query
    max_token_count=4096 
    temperature=1
    top_p=1
    stop_sequences=[]
    
    body_string = "{\"inputText\":\"" + f"{prompt_text}" +\
                    "\",\"textGenerationConfig\":{" +\
                    "\"maxTokenCount\":" + f"{max_token_count}" +\
                    ",\"temperature\":" + f"{temperature}" +\
                    ",\"topP\":" + f"{top_p}" +\
                    ",\"stopSequences\":" + f"{stop_sequences}" +\
                    "}}"
                    
    body = bytes(body_string, 'utf-8')
    print('prompt_text: ', prompt_text)
    response = boto3_bedrock.invoke_model(
        modelId = model_id,
        contentType = "application/json",
        accept = "application/json",
        body = body)
    response_lines = response['body'].readlines()
    json_str = response_lines[0].decode('utf-8')

    json_obj = json.loads(json_str)
    result_text = json_obj['results'][0]['outputText']
    return result_text


if 'user_stories' not in st.session_state:
    st.session_state['user_stories'] = None
if 'data_model' not in st.session_state:
    st.session_state['data_model'] = None
if 'api_specs' not in st.session_state:
    st.session_state['api_specs'] = None


languages = ['English', 'Spanish', 'German', 'Portugese', 'Irish', 'Korean', 'Swedish', 'Norwegian', 'Danish', 'Icelandic', 'Finnish', 'Star Trek - Klingon', 'Star Trek - Ferengi', 'Italian', 'French', 'Japanese', 'Mandarin', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Arabic', 'Hebrew']

st.set_page_config(page_title="GenAI Agile Guru", page_icon="high_brightness")

st.markdown(
    """
    ### :red[Note] 
    - For showcasing at large events please reach out to rangarap@ or dabounds@ for inputs
    - Please review and comply with the [Generative AI Acceptable Use Policy](https://policy.a2z.com/docs/568686/publication)
    - Use these selection of [samples for playing with the demos](https://amazon.awsapps.com/workdocs/index.html#/folder/085a7d2cc912f998468435fdf7eab6e9bb09ae855acfb9b16aea59de7d547e21).  
    - The demos should not be considered as an actual prototype or working version of a proposed solution
    - Source code available in the [GitLab repo](https://gitlab.aws.dev/dabounds/gen-ai-demos) and associated [Documentation](https://gitlab.aws.dev/dabounds/gen-ai-demos/-/tree/development/static/Documentation).
    """)

st.markdown("# From epic to Epic in seconds")
st.sidebar.header("GenAI Agile Guru")
model = 'Anthropic Claude'

def GetAnswers(query):
    question = 'Create 5 agile scrum user stories and acceptance criteria for each user story in '+language+' for '+ query.strip("query:")
    print('question: ', question)
    generated_text = call_bedrock_titan(question)
    if generated_text != '':
        generated_text = generated_text.replace("$","\$")
        us_answer = str(generated_text)
    else:
        us_answer = 'The model did not find an answer to your question, please try again'   

st.write("**Instructions:** \n - Type an epic story \n - You will see user stories, data model, api specs, and BDD scenarios automatically generated for your epic \n")

p_summary = '''
- funds transfer for banking \n
- login to member portal and check balance \n
- track and redeem rewards points \n
- create customized landing page for website \n
'''
  
st.sidebar.write('### Suggested epics to get started \n\n' + 
            p_summary)

input_text = st.text_input('**Type an epic**', key='text_ag')
default_lang_ix = languages.index('English')
language = st.selectbox(
    '**Select an output language.**',
    options=languages, index=default_lang_ix)

generated_text = ''
dm_generated_text = ''
as_generated_text = ''
bd_generated_text = ''
us_answer = ''
as_answer = ''
dm_answer = ''
bd_answer = ''
if input_text != '':
    us_answer = GetAnswers(input_text)
    tab1, tab2, tab3, tab4 = st.tabs(["User Stories", "Data Model", "API Specs", "BDD Secenarios"])
    #c1, c2 = st.columns(2)
    with tab1:
        if us_answer:
            st.write("**User stories for your epic**")
            st.write(us_answer)
    """
    with tab2:
        dm_generated_text = call_bedrock_titan('Create a data model in '+language+' for each of the user stories in '+str(us_answer))
        if dm_generated_text != '':
            dm_generated_text = dm_generated_text.replace("$","\$")
            dm_answer = str(dm_generated_text)
            st.session_state.data_model = dm_answer
        else:
            dm_answer = 'Claude did not find an answer to your question, please try again' 
        if dm_answer:
            st.write("**Data model for your user stories**")    
            st.write(dm_answer)
    with tab3:
        request = 'Create microservices API specifications in '+language+' for each of the data models in '+ str(dm_answer)
        print('request: ', request)
        as_generated_text = call_bedrock_titan(request)
        if as_generated_text != '':
            as_generated_text = as_generated_text.replace("$","\$")
            as_answer = str(as_generated_text)
            st.session_state.api_specs = as_answer
        else:
            as_answer = 'Claude did not find an answer to your question, please try again'
        if as_answer:        
            st.write("**API Specs for your user stories**")  
            st.write(as_answer)
    with tab4:
        bd_generated_text = call_bedrock_titan('Create behavior driven development scenarios using cucumber in '+language+' for each of the user stories in '+ str(us_answer))
        if bd_generated_text != '':
            bd_generated_text = bd_generated_text.replace("$","\$")
            bd_answer = str(bd_generated_text)
        else:
            bd_answer = 'Claude did not find an answer to your question, please try again'
        if bd_answer:
            st.write("**BDD Scenarios for your user stories**")
            st.write(bd_answer)
    """